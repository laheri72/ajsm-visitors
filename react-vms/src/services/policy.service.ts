import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { INSTITUTIONAL_POLICY } from "../config/policy.config";

export interface PolicySettings {
  cutoffTime: string | null; // e.g. "17:00" or null/empty if disabled
  updatedAt?: any;
  updatedBy?: string;
}

const policyDocRef = doc(db, "settings", "policy");

/**
 * Listens to real-time institutional policy settings in Firestore /settings/policy.
 * Falls back to policy.config.ts default if document does not exist.
 */
export function listenToPolicySettings(callback: (settings: PolicySettings) => void) {
  return onSnapshot(policyDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        cutoffTime: data.cutoffTime !== undefined ? data.cutoffTime : INSTITUTIONAL_POLICY.REGISTRATION_CUTOFF_TIME,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      });
    } else {
      callback({
        cutoffTime: INSTITUTIONAL_POLICY.REGISTRATION_CUTOFF_TIME,
      });
    }
  });
}

/**
 * Updates the registration cutoff time in Firestore /settings/policy (Admin only).
 */
export async function updatePolicyCutoffTime(cutoffTime: string | null, updatedByEmail: string = "admin@ajsm.edu") {
  await setDoc(
    policyDocRef,
    {
      cutoffTime: cutoffTime ? cutoffTime.trim() : "",
      updatedAt: serverTimestamp(),
      updatedBy: updatedByEmail,
    },
    { merge: true }
  );
}
