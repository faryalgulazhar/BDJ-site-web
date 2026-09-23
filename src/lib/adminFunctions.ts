import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface SetAdminStatusArgs {
  targetUid: string;
  makeAdmin: boolean;
}

/**
 * Calls the `setAdminStatus` Cloud Function.
 * Only admins can promote; only superAdmins can demote.
 * superAdmin users can never be demoted through this function.
 */
export async function callSetAdminStatus(
  targetUid: string,
  makeAdmin: boolean
): Promise<void> {
  const fn = httpsCallable<SetAdminStatusArgs, void>(functions, "setAdminStatus");
  await fn({ targetUid, makeAdmin });
}
