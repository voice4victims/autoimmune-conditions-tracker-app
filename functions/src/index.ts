import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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

  const rcAppUserId: string = event.app_user_id || "";
  if (!rcAppUserId) {
    res.status(200).send("No app_user_id");
    return;
  }

  const usersSnap = await db
    .collection("users")
    .where("rcId", "==", rcAppUserId)
    .limit(1)
    .get();

  let firebaseUid: string | null = null;
  if (!usersSnap.empty) {
    firebaseUid = usersSnap.docs[0].id;
  }

  if (!firebaseUid) {
    res.status(200).send("User not found");
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
