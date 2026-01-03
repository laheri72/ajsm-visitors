import {
  collection,
  onSnapshot,
  // orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Visitor } from "../models/Visitor";

const visitorsRef = collection(db, "visitors");

export function listenToVisitors(
  callback: (visitors: Visitor[]) => void
) {
  const q = query(visitorsRef);

  return onSnapshot(q, (snapshot) => {
    const data: Visitor[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Visitor),
      id: doc.id,
    }));

    callback(data);
  });
}

import {
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

export async function checkInVisitor(
  visitorId: string,
  cardNumber: string
) {
  const ref = doc(db, "visitors", visitorId);

  await updateDoc(ref, {
    status: "checked-in",
    cardNumber,
    checkInTime: serverTimestamp(),
  });
}

export async function checkOutVisitor(visitorId: string) {
  await runTransaction(db, async (tx) => {
    const visitorRef = doc(db, "visitors", visitorId);
    const visitorSnap = await tx.get(visitorRef);

    if (!visitorSnap.exists()) {
      throw new Error("Visitor not found");
    }

    const visitor = visitorSnap.data();

    if (visitor.status !== "checked-in") {
      throw new Error("Visitor not checked in");
    }

    // 1️⃣ Update visitor
    tx.update(visitorRef, {
      status: "checked-out",
      checkOutTime: serverTimestamp(),
    });

    // 2️⃣ Release card IF assigned
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

import { getDoc } from "firebase/firestore";

export async function getVisitorById(visitorId: string) {
  const ref = doc(db, "visitors", visitorId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as any),
  };
}

export async function deleteVisitor(visitor: any) {
  if (visitor.status === "checked-in") {
    throw new Error("Cannot delete checked-in visitor");
  }

  await deleteDoc(doc(db, "visitors", visitor.id));
}

import {
  runTransaction,
} from "firebase/firestore";

export async function generateCardNumber(): Promise<string> {
  const counterRef = doc(db, "counters", "visitorCard");

  const cardNumber = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    if (!snap.exists()) {
      throw new Error("Card counter not initialized");
    }

    const current = snap.data().current || 0;
    const next = current + 1;

    tx.update(counterRef, { current: next });

    return `VISIT-${String(next).padStart(3, "0")}`;
  });

  return cardNumber;
}
