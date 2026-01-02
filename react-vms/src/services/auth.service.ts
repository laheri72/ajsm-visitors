import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import type { UserRole } from "../models/UserRole";

/**
 * Resolve role based on email
 * (same logic as old app.js)
 */
export function resolveUserRole(user: User | null): UserRole {
  if (!user || !user.email) return null;

  const email = user.email.toLowerCase();

  if (email === "admin@ajsm.edu") return "ADMIN";
  if (email === "desk@ajsm.edu") return "DESK";

  return "GUEST";
}

export function listenToAuthChanges(
  callback: (user: User | null, role: UserRole) => void
) {
  return onAuthStateChanged(auth, (user) => {
    const role = resolveUserRole(user);
    callback(user, role);
  });
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}
