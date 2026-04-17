import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";
import * as crypto from "crypto";

initializeApp();
const db = getFirestore();

async function checkRateLimit(
  uid: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<void> {
  const ref = db.collection("rate_limits").doc(`${uid}:${action}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();

    if (!data || now - data.window_start > windowMs) {
      tx.set(ref, { requests: 1, window_start: now });
      return;
    }

    if (data.requests >= maxRequests) {
      throw new HttpsError(
        "resource-exhausted",
        `Rate limit exceeded. Try again in ${Math.ceil((data.window_start + windowMs - now) / 1000)}s`
      );
    }

    tx.update(ref, { requests: FieldValue.increment(1) });
  });
}

export const validateProviderAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { token } = request.data;
  if (!token) {
    throw new HttpsError("invalid-argument", "Missing token");
  }

  const providerUid = request.auth.uid;

  await checkRateLimit(providerUid, "provider_access", 10, 900000);

  const linksSnap = await db
    .collection("magic_links")
    .where("access_token", "==", token)
    .where("is_active", "==", true)
    .limit(1)
    .get();

  if (linksSnap.empty) {
    throw new HttpsError("permission-denied", "Invalid or inactive magic link");
  }

  const linkDoc = linksSnap.docs[0];
  const linkData = linkDoc.data();

  const expiresAt = linkData.expires_at as Timestamp;
  if (expiresAt.toDate() < new Date()) {
    throw new HttpsError("permission-denied", "Magic link has expired");
  }

  if (
    linkData.max_access_count &&
    linkData.access_count >= linkData.max_access_count
  ) {
    throw new HttpsError("permission-denied", "Access limit exceeded");
  }

  await linkDoc.ref.update({
    access_count: FieldValue.increment(1),
    last_accessed: Timestamp.now(),
  });

  await db.collection("provider_sessions").doc(providerUid).set({
    child_id: linkData.child_id,
    family_id: linkData.family_id,
    magic_link_id: linkDoc.id,
    permissions: linkData.permissions,
    expires_at: linkData.expires_at,
    created_at: Timestamp.now(),
  });

  const permissions: string[] = linkData.permissions || [];
  const childId = linkData.child_id;
  const data: Record<string, unknown> = {};

  const childDoc = await db.collection("children").doc(childId).get();
  if (childDoc.exists) {
    const c = childDoc.data()!;
    data.child_profile = {
      name: c.name,
      age: c.age,
      diagnosis: c.diagnosis,
      created_at: c.created_at,
    };
  }

  if (permissions.includes("view_symptoms")) {
    const snap = await db
      .collection("children")
      .doc(childId)
      .collection("symptoms")
      .limit(100)
      .get();
    data.symptoms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  if (permissions.includes("view_treatments")) {
    const snap = await db
      .collection("children")
      .doc(childId)
      .collection("treatments")
      .limit(50)
      .get();
    data.treatments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  if (permissions.includes("view_vitals")) {
    const snap = await db
      .collection("vital_signs")
      .where("child_id", "==", childId)
      .limit(50)
      .get();
    data.vitals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  if (permissions.includes("view_notes")) {
    const snap = await db
      .collection("children")
      .doc(childId)
      .collection("notes")
      .limit(50)
      .get();
    data.notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  if (permissions.includes("view_files")) {
    const snap = await db
      .collection("file_uploads")
      .where("child_id", "==", childId)
      .limit(20)
      .get();
    data.files = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  data.magic_link = {
    id: linkDoc.id,
    provider_name: linkData.provider_name,
    provider_email: linkData.provider_email,
    expires_at: linkData.expires_at,
    access_count: (linkData.access_count || 0) + 1,
    max_access_count: linkData.max_access_count,
    permissions: linkData.permissions,
  };

  await db.collection("magic_link_access").add({
    magic_link_id: linkDoc.id,
    provider_uid: providerUid,
    accessed_at: Timestamp.now(),
    user_agent: request.rawRequest?.headers?.["user-agent"] || null,
    source: "cloud_function",
  });

  return data;
});

export const getProviderFileUrl = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { fileId } = request.data;
  if (!fileId || typeof fileId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid fileId");
  }

  const providerUid = request.auth.uid;

  await checkRateLimit(providerUid, "file_download", 20, 900000);

  const sessionDoc = await db
    .collection("provider_sessions")
    .doc(providerUid)
    .get();
  if (!sessionDoc.exists) {
    throw new HttpsError("permission-denied", "No active provider session");
  }

  const session = sessionDoc.data()!;
  const expiresAt = session.expires_at as Timestamp;
  if (expiresAt.toDate() < new Date()) {
    throw new HttpsError("permission-denied", "Provider session expired");
  }

  const permissions: string[] = session.permissions || [];
  if (!permissions.includes("view_files")) {
    throw new HttpsError("permission-denied", "File access not permitted");
  }

  const fileDoc = await db.collection("file_uploads").doc(fileId).get();
  if (!fileDoc.exists) {
    throw new HttpsError("not-found", "File not found");
  }

  const fileData = fileDoc.data()!;
  if (fileData.child_id !== session.child_id) {
    throw new HttpsError(
      "permission-denied",
      "File does not belong to authorized child"
    );
  }

  if (!fileData.storage_path) {
    throw new HttpsError("not-found", "File has no storage path");
  }

  const bucket = getStorage().bucket();
  const file = bucket.file(fileData.storage_path);

  const [exists] = await file.exists();
  if (!exists) {
    throw new HttpsError("not-found", "File not found in storage");
  }

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  await db.collection("provider_access_audit").add({
    event_type: "file_download",
    provider_uid: providerUid,
    child_id: session.child_id,
    file_id: fileId,
    file_name: fileData.file_name || null,
    magic_link_id: session.magic_link_id,
    accessed_at: Timestamp.now(),
    source: "cloud_function",
  });

  return { url: signedUrl, expires_in: 3600 };
});

export const onProviderAccessLogged = onDocumentCreated(
  "magic_link_access/{accessId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    await db.collection("provider_access_audit").add({
      magic_link_id: data.magic_link_id,
      provider_uid: data.provider_uid || null,
      user_agent: data.user_agent || null,
      provider_info: data.provider_info || null,
      accessed_at: data.accessed_at || Timestamp.now(),
      logged_at: Timestamp.now(),
      source: "cloud_function",
    });
  }
);

export const onProviderSessionCreated = onDocumentCreated(
  "provider_sessions/{uid}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    await db.collection("provider_access_audit").add({
      event_type: "session_created",
      provider_uid: event.params.uid,
      child_id: data.child_id,
      family_id: data.family_id,
      magic_link_id: data.magic_link_id,
      permissions: data.permissions,
      expires_at: data.expires_at,
      created_at: data.created_at || Timestamp.now(),
      logged_at: Timestamp.now(),
      source: "cloud_function",
    });
  }
);

function hashUid(uid: string): string {
  return crypto.createHash("sha256").update(`rc_${uid}`).digest("hex");
}

export const onSubscriptionWebhook = onRequest({ secrets: ["REVENUECAT_WEBHOOK_SECRET"] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const authHeader = req.headers.authorization;
  const expectedToken = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    res.status(401).send("Unauthorized");
    return;
  }

  const event = req.body?.event;
  if (!event) {
    res.status(400).send("Missing event");
    return;
  }

  const candidateIds = new Set<string>();
  const addId = (v: unknown) => {
    if (typeof v === "string" && v && !v.startsWith("$RCAnonymousID:")) {
      candidateIds.add(v);
    }
  };
  addId(event.app_user_id);
  addId(event.original_app_user_id);
  addId(event.subscriber?.original_app_user_id);
  (Array.isArray(event.aliases) ? event.aliases : []).forEach(addId);
  (Array.isArray(event.transferred_to) ? event.transferred_to : []).forEach(addId);
  (Array.isArray(event.transferred_from) ? event.transferred_from : []).forEach(addId);

  if (candidateIds.size === 0) {
    res.status(200).send("No non-anonymous app_user_id");
    return;
  }

  let firebaseUid: string | null = null;
  let userDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  for (const candidate of candidateIds) {
    const usersSnap = await db
      .collection("users")
      .where("rcId", "==", candidate)
      .limit(1)
      .get();
    if (!usersSnap.empty) {
      firebaseUid = usersSnap.docs[0].id;
      userDoc = usersSnap.docs[0];
      break;
    }
  }

  if (!firebaseUid || !userDoc) {
    logger.warn("[onSubscriptionWebhook] No matching user for any candidate id", {
      eventType: event.type,
      candidateIds: Array.from(candidateIds),
    });
    res.status(200).send("User not found");
    return;
  }

  const existingUser = userDoc.data();
  if (existingUser.isLifetime) {
    res.status(200).send("Lifetime user — skipping");
    return;
  }

  const entitlements: Record<string, unknown> =
    event.subscriber?.entitlements || {};
  const activeEntitlements = Object.keys(entitlements).filter(
    (k) => (entitlements[k] as Record<string, unknown>)?.expires_date == null ||
      new Date((entitlements[k] as Record<string, string>).expires_date) > new Date()
  );

  let tier: "free" | "pro" | "family" = "free";
  if (activeEntitlements.includes("entitlement_family")) {
    tier = "family";
  } else if (activeEntitlements.includes("entitlement_pro")) {
    tier = "pro";
  }

  await db.collection("users").doc(firebaseUid).set(
    {
      subscriptionTier: tier,
      tierUpdatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  res.status(200).send("OK");
});

export const onUserConsentCreated = onDocumentCreated(
  "user_consents/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const rcId = hashUid(uid);

    await db.collection("users").doc(uid).set(
      {
        subscriptionTier: "free",
        rcId,
        tierUpdatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }
);

async function getOwnerTier(ownerUid: string): Promise<string> {
  const userDoc = await db.collection("users").doc(ownerUid).get();
  return userDoc.data()?.subscriptionTier || "free";
}

const WRITE_ROLES = ["caregiver", "admin", "parent"];
const ALLOWED_COLLECTIONS = [
  "symptoms", "treatments", "notes", "vital_signs", "food_diary",
];

export const acceptFamilyInvitation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { inviteCode } = request.data;
  if (!inviteCode || typeof inviteCode !== "string") {
    throw new HttpsError("invalid-argument", "Missing invitation code");
  }

  const uid = request.auth.uid;
  await checkRateLimit(uid, "accept_invitation", 5, 900000);

  const invSnap = await db
    .collection("family_invitations")
    .where("invitation_code", "==", inviteCode)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (invSnap.empty) {
    throw new HttpsError("not-found", "Invalid or expired invitation code");
  }

  const invDoc = invSnap.docs[0];
  const inv = invDoc.data();

  const expiresAt = inv.expires_at as Timestamp;
  if (expiresAt.toDate() < new Date()) {
    throw new HttpsError("deadline-exceeded", "Invitation has expired");
  }

  if (inv.invited_by === uid) {
    throw new HttpsError("permission-denied", "Cannot accept your own invitation");
  }

  const existingSnap = await db
    .collection("family_access")
    .where("family_id", "==", inv.family_id)
    .where("user_id", "==", uid)
    .where("is_active", "==", true)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    throw new HttpsError("already-exists", "You already have access to this family");
  }

  const ownerTier = await getOwnerTier(inv.family_id);

  let role = inv.role || "viewer";
  if (ownerTier === "free" && role !== "viewer") {
    role = "viewer";
  }
  if (ownerTier === "pro" && !["viewer", "caregiver"].includes(role)) {
    role = "caregiver";
  }

  const accessDocId = `${inv.family_id}_${uid}`;
  await db.collection("family_access").doc(accessDocId).set({
    family_id: inv.family_id,
    owner_user_id: inv.invited_by,
    user_id: uid,
    role,
    invited_by: inv.invited_by,
    accepted_at: Timestamp.now(),
    is_active: true,
  });

  await invDoc.ref.update({
    status: "accepted",
    accepted_by: uid,
    accepted_at: Timestamp.now(),
  });

  await db.collection("hipaa_audit_logs").add({
    user_id: inv.family_id,
    action: "caregiver_access_granted",
    resource_type: "family_access",
    caregiver_uid: uid,
    role,
    owner_tier: ownerTier,
    timestamp: Timestamp.now(),
    source: "cloud_function",
  });

  return { role, familyId: inv.family_id };
});

export const caregiverLogEntry = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { childId, collectionName, data: entryData } = request.data;
  if (!childId || !collectionName || !entryData) {
    throw new HttpsError("invalid-argument", "Missing childId, collectionName, or data");
  }

  if (!ALLOWED_COLLECTIONS.includes(collectionName)) {
    throw new HttpsError("invalid-argument", `Collection ${collectionName} is not allowed`);
  }

  const uid = request.auth.uid;
  await checkRateLimit(uid, "caregiver_log", 30, 60000);

  const childDoc = await db.collection("children").doc(childId).get();
  if (!childDoc.exists) {
    throw new HttpsError("not-found", "Child not found");
  }

  const childData = childDoc.data()!;
  const ownerUid = childData.userId;

  if (ownerUid === uid) {
    throw new HttpsError(
      "invalid-argument",
      "Owners should write directly, not through this function"
    );
  }

  const accessSnap = await db
    .collection("family_access")
    .where("family_id", "==", ownerUid)
    .where("user_id", "==", uid)
    .where("is_active", "==", true)
    .limit(1)
    .get();

  if (accessSnap.empty) {
    throw new HttpsError("permission-denied", "No active family access");
  }

  const access = accessSnap.docs[0].data();
  if (!WRITE_ROLES.includes(access.role)) {
    throw new HttpsError("permission-denied", "Your role does not allow logging entries");
  }

  const ownerTier = await getOwnerTier(ownerUid);
  if (ownerTier === "free") {
    throw new HttpsError(
      "permission-denied",
      "The account owner's plan does not support caregiver logging"
    );
  }

  const sanitizedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entryData)) {
    if (typeof key === "string" && key.length < 100 && !key.startsWith("_")) {
      sanitizedData[key] = value;
    }
  }

  sanitizedData.logged_by = uid;
  sanitizedData.logged_by_role = access.role;
  sanitizedData.created_at = Timestamp.now();

  const docRef = await db
    .collection("children")
    .doc(childId)
    .collection(collectionName)
    .add(sanitizedData);

  await db.collection("hipaa_audit_logs").add({
    user_id: ownerUid,
    action: "caregiver_data_write",
    resource_type: collectionName,
    resource_id: docRef.id,
    child_id: childId,
    caregiver_uid: uid,
    caregiver_role: access.role,
    owner_tier: ownerTier,
    timestamp: Timestamp.now(),
    source: "cloud_function",
  });

  return { id: docRef.id };
});

const RC_API_BASE = "https://api.revenuecat.com/v1";

async function grantRCEntitlement(
  rcAppUserId: string,
  entitlementId: string,
  durationMs: number | null
): Promise<boolean> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) return false;

  const body: Record<string, unknown> = {};
  if (durationMs) {
    const start = new Date();
    const end = new Date(start.getTime() + durationMs);
    body.start_time_ms = start.getTime();
    body.end_time_ms = end.getTime();
  }

  const res = await fetch(
    `${RC_API_BASE}/subscribers/${encodeURIComponent(rcAppUserId)}/entitlements/${entitlementId}/promotional`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  return res.ok;
}

export const redeemBetaCode = onCall({ secrets: ["REVENUECAT_SECRET_KEY"] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { code } = request.data;
  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "Missing beta code");
  }

  const uid = request.auth.uid;
  await checkRateLimit(uid, "beta_redeem", 5, 900000);

  const normalizedCode = code.trim().toUpperCase();

  const codeSnap = await db
    .collection("beta_codes")
    .where("code", "==", normalizedCode)
    .limit(1)
    .get();

  if (codeSnap.empty) {
    throw new HttpsError("not-found", "Invalid beta code");
  }

  const codeDoc = codeSnap.docs[0];
  const codeData = codeDoc.data();

  if (codeData.redeemed) {
    throw new HttpsError("already-exists", "This code has already been redeemed");
  }

  const userDoc = await db.collection("users").doc(uid).get();
  if (userDoc.exists && userDoc.data()?.betaAccess) {
    throw new HttpsError("already-exists", "You already have beta access");
  }

  const rcId = userDoc.data()?.rcId || hashUid(uid);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const granted = await grantRCEntitlement(rcId, "entitlement_pro", sevenDaysMs);

  if (!granted) {
    throw new HttpsError("internal", "Failed to grant promotional entitlement");
  }

  await db.runTransaction(async (tx) => {
    const freshCode = await tx.get(codeDoc.ref);
    if (freshCode.data()?.redeemed) {
      throw new HttpsError("already-exists", "This code has already been redeemed");
    }

    tx.update(codeDoc.ref, {
      redeemed: true,
      redeemed_by: uid,
      redeemed_at: Timestamp.now(),
    });

    tx.set(
      db.collection("users").doc(uid),
      {
        betaAccess: true,
        betaRedeemedAt: Timestamp.now(),
        betaCodeUsed: normalizedCode,
      },
      { merge: true }
    );
  });

  await db.collection("hipaa_audit_logs").add({
    user_id: uid,
    action: "beta_code_redeemed",
    resource_type: "beta_codes",
    beta_code: normalizedCode,
    timestamp: Timestamp.now(),
    source: "cloud_function",
  });

  return { tier: "pro" };
});

const BETA_UPGRADE_DAYS = 7;

export const upgradeBetaUsers = onSchedule(
  { schedule: "every 24 hours", secrets: ["REVENUECAT_SECRET_KEY"] },
  async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - BETA_UPGRADE_DAYS);

    const snap = await db
      .collection("users")
      .where("betaAccess", "==", true)
      .where("isLifetime", "!=", true)
      .get();

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const redeemedAt = data.betaRedeemedAt as Timestamp | undefined;
      if (!redeemedAt || redeemedAt.toDate() > cutoff) continue;

      const rcId = data.rcId || hashUid(userDoc.id);
      const granted = await grantRCEntitlement(rcId, "entitlement_family", null);
      if (!granted) continue;

      await userDoc.ref.update({
        isLifetime: true,
        tierUpdatedAt: Timestamp.now(),
      });

      await db.collection("hipaa_audit_logs").add({
        user_id: userDoc.id,
        action: "beta_upgrade_to_family_lifetime",
        resource_type: "users",
        timestamp: Timestamp.now(),
        source: "cloud_function",
      });
    }
  }
);

async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const tokenDoc = await db.collection("push_tokens").doc(userId).get();
  if (!tokenDoc.exists) return false;

  const tokenData = tokenDoc.data();
  const token = tokenData?.token;
  if (!token) return false;

  try {
    await getMessaging().send({
      token,
      notification: { title, body },
      data: data || {},
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
          },
        },
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
    });
    return true;
  } catch (error: any) {
    console.error("Failed to send push:", error?.message || error);
    if (error?.code === "messaging/registration-token-not-registered") {
      await tokenDoc.ref.update({ token: null, invalidated_at: Timestamp.now() });
    }
    return false;
  }
}

export const sendTestPush = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;
  await checkRateLimit(uid, "send_test_push", 5, 60000);

  const sent = await sendPushToUser(
    uid,
    "PANDAS Tracker Test",
    "Push notifications are working!",
    { type: "test" }
  );

  if (!sent) {
    throw new HttpsError(
      "failed-precondition",
      "No push token registered for this user. Make sure you've granted notification permissions."
    );
  }

  return { sent: true };
});

export const sendPushNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { targetUserId, title, body, data } = request.data;
  if (!targetUserId || !title || !body) {
    throw new HttpsError("invalid-argument", "Missing targetUserId, title, or body");
  }

  const callerUid = request.auth.uid;
  await checkRateLimit(callerUid, "send_push", 30, 60000);

  if (targetUserId !== callerUid) {
    const accessDocId = `${targetUserId}_${callerUid}`;
    const accessDoc = await db.collection("family_access").doc(accessDocId).get();
    if (!accessDoc.exists || !accessDoc.data()?.is_active) {
      throw new HttpsError("permission-denied", "No access to send notifications to this user");
    }
  }

  const sent = await sendPushToUser(targetUserId, title, body, data);
  return { sent };
});

export const reconcileSubscriptionTiers = onDocumentCreated(
  {
    document: "admin_actions/{actionId}",
    secrets: ["REVENUECAT_SECRET_KEY"],
    timeoutSeconds: 540,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (data.type !== "reconcile_subscription_tiers") return;

    const dryRun = data.dryRun === true;
    const secretKey = process.env.REVENUECAT_SECRET_KEY;
    if (!secretKey) {
      await snap.ref.set(
        { status: "error", error: "Missing REVENUECAT_SECRET_KEY", completedAt: Timestamp.now() },
        { merge: true }
      );
      return;
    }

    await snap.ref.set({ status: "running", startedAt: Timestamp.now() }, { merge: true });

    const usersSnap = await db.collection("users").get();
    let checked = 0;
    let skippedLifetime = 0;
    let updated = 0;
    let promoted = 0;
    let demoted = 0;
    let defaultedFree = 0;
    let errors = 0;
    const changes: Array<{
      uid: string;
      before: string | null;
      after: string;
      reason: string;
    }> = [];

    const now = Date.now();
    const isActive = (ent: unknown): boolean => {
      if (!ent || typeof ent !== "object") return false;
      const expires = (ent as { expires_date?: string | null }).expires_date;
      if (expires === null || expires === undefined) return true;
      return new Date(expires).getTime() > now;
    };

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const data = userDoc.data();

      if (data.isLifetime) {
        skippedLifetime++;
        continue;
      }

      checked++;
      const rcId = typeof data.rcId === "string" ? data.rcId : null;
      const currentTier: string | null =
        typeof data.subscriptionTier === "string" ? data.subscriptionTier : null;

      let rcTier: "free" | "pro" | "family" = "free";
      let reason = "no rcId";

      if (rcId) {
        try {
          const rcRes = await fetch(
            `${RC_API_BASE}/subscribers/${encodeURIComponent(rcId)}`,
            {
              headers: { Authorization: `Bearer ${secretKey}` },
            }
          );
          if (rcRes.status === 404) {
            reason = "RC 404";
          } else if (!rcRes.ok) {
            errors++;
            logger.warn("[reconcile] RC fetch failed", {
              uid,
              status: rcRes.status,
            });
            continue;
          } else {
            const rcData = (await rcRes.json()) as {
              subscriber?: { entitlements?: Record<string, unknown> };
            };
            const entitlements = rcData?.subscriber?.entitlements ?? {};
            if (isActive(entitlements.entitlement_family)) {
              rcTier = "family";
              reason = "RC entitlement_family active";
            } else if (isActive(entitlements.entitlement_pro)) {
              rcTier = "pro";
              reason = "RC entitlement_pro active";
            } else {
              reason = "RC no active entitlements";
            }
          }
        } catch (e) {
          errors++;
          logger.warn("[reconcile] RC fetch exception", { uid, err: String(e) });
          continue;
        }
      }

      if (currentTier !== rcTier) {
        changes.push({ uid, before: currentTier, after: rcTier, reason });
        if (!dryRun) {
          await userDoc.ref.set(
            {
              subscriptionTier: rcTier,
              tierUpdatedAt: Timestamp.now(),
            },
            { merge: true }
          );
        }
        updated++;
        if (
          (currentTier === null || currentTier === "free") &&
          rcTier !== "free"
        ) {
          promoted++;
        } else if (
          (currentTier === "pro" || currentTier === "family") &&
          rcTier === "free"
        ) {
          demoted++;
        } else if (currentTier === null && rcTier === "free") {
          defaultedFree++;
        }
      }
    }

    await snap.ref.set(
      {
        status: "completed",
        completedAt: Timestamp.now(),
        dryRun,
        totals: {
          checkedUsers: checked,
          skippedLifetime,
          updated,
          promoted,
          demoted,
          defaultedFree,
          errors,
        },
        changes,
      },
      { merge: true }
    );
  }
);
