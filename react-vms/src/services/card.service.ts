import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";


/**
 * Assigns a card to a visitor (on check-in)
 */
export async function activateCard(
  cardNumber: string,
  visitorId: string
) {
  const ref = doc(db, "cards", cardNumber);

  await setDoc(
    ref,
    {
      cardNumber,
      status: "active",
      assignedTo: visitorId,
      assignedAt: serverTimestamp(),
      releasedAt: null,
    },
    { merge: true }
  );
}

/**
 * Releases a card (on check-out)
 */
export async function releaseCard(cardNumber: string) {
  const ref = doc(db, "cards", cardNumber);

  await updateDoc(ref, {
    status: "available",
    assignedTo: null,
    releasedAt: serverTimestamp(),
  });
}

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export function listenActiveCards(
  callback: (cards: any[]) => void
) {
  const q = query(
    collection(db, "cards"),
    where("status", "==", "active")
  );

  return onSnapshot(q, (snap) => {
    const cards = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));
    callback(cards);
  });
}



export async function forceReleaseCard(cardNumber: string) {
  const ref = doc(db, "cards", cardNumber);

  await updateDoc(ref, {
    status: "available",
    assignedTo: null,
    releasedAt: serverTimestamp(),
  });
}

export async function markCardLost(cardNumber: string) {
  const ref = doc(db, "cards", cardNumber);

  await updateDoc(ref, {
    status: "lost",
  });
}

export async function disableCard(cardNumber: string) {
  const ref = doc(db, "cards", cardNumber);

  await updateDoc(ref, {
    status: "disabled",
  });
}
