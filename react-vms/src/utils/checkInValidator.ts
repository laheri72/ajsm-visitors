import type { Visitor } from "../models/Visitor";
import { getTodayDateString } from "./dateUtils";

export function validateCheckIn(visitor: Visitor): string | null {
  if (visitor.status !== "scheduled") {
    return "Visitor is not scheduled for check-in.";
  }

  const today = getTodayDateString();
  if (visitor.scheduledDate !== today) {
    return `Visitor is scheduled for ${visitor.scheduledDate}, not today (${today}).`;
  }

  const now = new Date();
  const [h, m] = visitor.scheduledTime.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);

  if (now < scheduled) {
    return "Check-in is not allowed before scheduled time.";
  }

  return null;
}

export function validateCheckOut(visitor: Visitor): string | null {
  if (visitor.status !== "checked-in") {
    return "Only checked-in visitors can be checked out.";
  }
  return null;
}
