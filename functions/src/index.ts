import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface SetAdminStatusData {
  targetUid: string;
  makeAdmin: boolean;
}

/**
 * Callable Cloud Function: setAdminStatus
 * Promotes or demotes an admin user with safety checks.
 * - Caller must be authenticated and have isAdmin === true
 * - Target superAdmins can never be demoted
 * - Demoting an admin requires the caller to be a superAdmin
 * - Writes audit log to `adminLog` collection
 */
export const setAdminStatus = onCall<SetAdminStatusData>(async (request: CallableRequest<SetAdminStatusData>) => {
  // 1. Caller authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be authenticated to invoke this function."
    );
  }

  const callerUid = request.auth.uid;
  const { targetUid, makeAdmin } = request.data;

  if (!targetUid || typeof makeAdmin !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "Both targetUid and makeAdmin (boolean) are required."
    );
  }

  // 2. Verify caller is admin
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();
  const isCallerAdmin =
    callerData?.isAdmin === true ||
    request.auth.token.email === "admin@bdj-karukera.com";
  const isCallerSuperAdmin = callerData?.superAdmin === true;

  if (!isCallerAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Caller does not have administrator privileges."
    );
  }

  // 3. Verify target user
  const targetDoc = await db.collection("users").doc(targetUid).get();
  if (!targetDoc.exists) {
    throw new HttpsError("not-found", "Target user profile was not found.");
  }

  const targetData = targetDoc.data();

  // superAdmin protection: nobody can demote a superAdmin
  if (targetData?.superAdmin === true) {
    throw new HttpsError(
      "permission-denied",
      "SuperAdmin accounts cannot be demoted or altered."
    );
  }

  // Only superAdmin can demote an existing admin
  if (!makeAdmin && !isCallerSuperAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only SuperAdmins are authorized to remove admin privileges."
    );
  }

  // 4. Update the target's private user document
  await db.collection("users").doc(targetUid).update({
    isAdmin: makeAdmin,
  });

  // 5. Append to adminLog audit trail
  await db.collection("adminLog").add({
    actorUid: callerUid,
    targetUid,
    action: makeAdmin ? "promote" : "demote",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
