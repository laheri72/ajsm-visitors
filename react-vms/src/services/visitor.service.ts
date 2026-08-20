import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Visitor } from "../models/Visitor";
import { validateRegistrationInput, type VisitorRegistrationInput } from "../utils/registrationValidator";
import { INSTITUTIONAL_POLICY } from "../config/policy.config";
import { sendVisitorQREmail } from "./email.service";

const visitorsRef = collection(db, "visitors");

/**
 * Listens to real-time changes in the visitors collection.
 */
export function listenToVisitors(callback: (visitors: Visitor[]) => void) {
  const q = query(visitorsRef);

  return onSnapshot(q, (snapshot) => {
    const data: Visitor[] = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Visitor),
      id: docSnap.id,
    }));

    callback(data);
  });
}

/**
 * Registers a new visitor with institutional barricading (24-hour duplicate prevention for mobile & email),
 * cutoff time enforcement, atomic transaction lock, and primary QR email delivery.
 */
export async function createVisitor(
  input: VisitorRegistrationInput,
  activeCutoffTime?: string | null
): Promise<{
  visitorId: string;
  emailResult: { success: boolean; message: string };
}> {
  // 1. Input & Cutoff Validation
  const validationError = validateRegistrationInput(input, activeCutoffTime);
  if (validationError) {
    throw new Error(validationError);
  }

  const cleanMobile = input.mobile.replace(/\D/g, "");
  const cleanEmail = input.email.trim().toLowerCase();
  const windowMs = INSTITUTIONAL_POLICY.DUPLICATE_REGISTRATION_WINDOW_HOURS * 60 * 60 * 1000;

  // 2. Barricade Document References
  const newVisitorRef = doc(collection(db, "visitors"));
  const mobileBarricadeRef = doc(db, "visitor_barricades", `mob_${cleanMobile}`);
  const emailBarricadeRef = doc(db, "visitor_barricades", `email_${cleanEmail}`);

  // Pre-check mobile lock document
  const mobSnap = await getDoc(mobileBarricadeRef);
  if (mobSnap.exists()) {
    const lockData = mobSnap.data();
    if (lockData.expiresAt > Date.now()) {
      if (lockData.visitorId) {
        const linkedVisitorSnap = await getDoc(doc(db, "visitors", lockData.visitorId));
        if (linkedVisitorSnap.exists()) {
          throw new Error(
            `A registration with mobile number (${cleanMobile}) already exists within the last 24 hours. Multiple registrations within 24 hours are prohibited by policy.`
          );
        } else {
          // Linked visitor was deleted by Admin -> clean up stale lock
          await deleteDoc(mobileBarricadeRef).catch(() => {});
        }
      }
    }
  }

  // Pre-check email lock document
  const emailSnap = await getDoc(emailBarricadeRef);
  if (emailSnap.exists()) {
    const lockData = emailSnap.data();
    if (lockData.expiresAt > Date.now()) {
      if (lockData.visitorId) {
        const linkedVisitorSnap = await getDoc(doc(db, "visitors", lockData.visitorId));
        if (linkedVisitorSnap.exists()) {
          throw new Error(
            `A registration with email address (${cleanEmail}) already exists within the last 24 hours. Multiple registrations within 24 hours are prohibited by policy.`
          );
        } else {
          // Linked visitor was deleted by Admin -> clean up stale lock
          await deleteDoc(emailBarricadeRef).catch(() => {});
        }
      }
    }
  }

  // 3. Atomic Transaction for Visitor Creation & Barricade Locking
  await runTransaction(db, async (tx) => {
    // Read barricade lock documents inside transaction
    const mobLockSnap = await tx.get(mobileBarricadeRef);
    const emailLockSnap = await tx.get(emailBarricadeRef);

    if (mobLockSnap.exists()) {
      const lockData = mobLockSnap.data();
      if (lockData.expiresAt > Date.now() && lockData.visitorId) {
        const linkedVisitorSnap = await tx.get(doc(db, "visitors", lockData.visitorId));
        if (linkedVisitorSnap.exists()) {
          throw new Error(
            `A registration lock for mobile ${cleanMobile} is active. Please wait 24 hours before registering again.`
          );
        }
      }
    }

    if (emailLockSnap.exists()) {
      const lockData = emailLockSnap.data();
      if (lockData.expiresAt > Date.now() && lockData.visitorId) {
        const linkedVisitorSnap = await tx.get(doc(db, "visitors", lockData.visitorId));
        if (linkedVisitorSnap.exists()) {
          throw new Error(
            `A registration lock for email ${cleanEmail} is active. Please wait 24 hours before registering again.`
          );
        }
      }
    }

    const expiresAt = Date.now() + windowMs;

    // Set Visitor Document
    tx.set(newVisitorRef, {
      name: input.name.trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      purpose: input.purpose.trim(),
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      duration: input.duration || "1 hour",
      status: "scheduled",
      createdAt: serverTimestamp(),
    });

    // Set Atomic Barricade Locks
    tx.set(mobileBarricadeRef, {
      type: "mobile",
      value: cleanMobile,
      visitorId: newVisitorRef.id,
      createdAt: serverTimestamp(),
      expiresAt,
    });

    tx.set(emailBarricadeRef, {
      type: "email",
      value: cleanEmail,
      visitorId: newVisitorRef.id,
      createdAt: serverTimestamp(),
      expiresAt,
    });
  });

  const visitorId = newVisitorRef.id;

  // 4. Trigger Primary Email Delivery with QR Code
  const emailResult = await sendVisitorQREmail({
    id: visitorId,
    name: input.name.trim(),
    email: cleanEmail,
    mobile: cleanMobile,
    purpose: input.purpose.trim(),
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    duration: input.duration,
  });

  return {
    visitorId,
    emailResult,
  };
}

/**
 * Checks in a visitor with card assignment.
 */
export async function checkInVisitor(visitorId: string, cardNumber: string) {
  const ref = doc(db, "visitors", visitorId);

  await updateDoc(ref, {
    status: "checked-in",
    cardNumber,
    checkInTime: serverTimestamp(),
  });
}

/**
 * Checks out a visitor and atomically releases the assigned card.
 */
export async function checkOutVisitor(visitorId: string) {
  await runTransaction(db, async (tx) => {
    const visitorRef = doc(db, "visitors", visitorId);
    const visitorSnap = await tx.get(visitorRef);

    if (!visitorSnap.exists()) {
      throw new Error("Visitor not found");
    }

    const visitor = visitorSnap.data();

    if (visitor.status !== "checked-in") {
      throw new Error("Visitor is not currently checked in");
    }

    // 1. Update visitor status
    tx.update(visitorRef, {
      status: "checked-out",
      checkOutTime: serverTimestamp(),
    });

    // 2. Release card if assigned
    if (visitor.cardNumber) {
      const cardRef = doc(db, "cards", visitor.cardNumber);
      tx.update(cardRef, {
        status: "available",
        assignedTo: null,
        releasedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Fetches a single visitor by ID.
 */
export async function getVisitorById(visitorId: string): Promise<Visitor | null> {
  const ref = doc(db, "visitors", visitorId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    ...(snap.data() as Visitor),
    id: snap.id,
  };
}

/**
 * Deletes a visitor record ONLY if their visit is not completed or checked-in.
 * Preserves completed ("checked-out") visit records for institutional audit.
 * Also cleans up barricade locks when a scheduled visit is deleted by Admin.
 */
export async function deleteVisitor(visitor: Visitor | any) {
  if (visitor.status === "checked-out") {
    throw new Error("Completed visit records cannot be deleted. Preserved for institutional audit & accountability.");
  }
  if (visitor.status === "checked-in") {
    throw new Error("Currently checked-in visitors cannot be deleted. Please check out the visitor first.");
  }

  // 1. Delete visitor document
  await deleteDoc(doc(db, "visitors", visitor.id));

  // 2. Release barricade lock documents so the user/admin can re-register if needed
  if (visitor.mobile) {
    const cleanMobile = String(visitor.mobile).replace(/\D/g, "");
    if (cleanMobile) {
      await deleteDoc(doc(db, "visitor_barricades", `mob_${cleanMobile}`)).catch(() => {});
    }
  }

  if (visitor.email) {
    const cleanEmail = String(visitor.email).trim().toLowerCase();
    if (cleanEmail) {
      await deleteDoc(doc(db, "visitor_barricades", `email_${cleanEmail}`)).catch(() => {});
    }
  }
}

/**
 * Generates next sequential card number (e.g. VISIT-001) in a Firestore transaction.
 */
export async function generateCardNumber(): Promise<string> {
  const counterRef = doc(db, "counters", "visitorCard");

  const cardNumber = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    let current = 0;
    if (snap.exists()) {
      current = snap.data().current || 0;
    }

    const next = current + 1;
    tx.set(counterRef, { current: next }, { merge: true });

    return `VISIT-${String(next).padStart(3, "0")}`;
  });

  return cardNumber;
}
