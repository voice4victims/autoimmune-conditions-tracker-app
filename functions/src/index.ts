import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const validateProviderAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { token } = request.data;
  if (!token) {
    throw new HttpsError("invalid-argument", "Missing token");
  }

  const providerUid = request.auth.uid;

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
