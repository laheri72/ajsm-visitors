import { INSTITUTIONAL_POLICY } from "../config/policy.config";

/**
 * Returns current date string "YYYY-MM-DD" in the institution's local timezone (e.g. Asia/Kolkata).
 * Solves the UTC date mismatch bug identified in audit.
 */
export function getTodayDateString(timeZone: string = INSTITUTIONAL_POLICY.TIMEZONE): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // "YYYY-MM-DD"
}

/**
 * Returns current time string "HH:mm" in 24-hour format in the institution's local timezone.
 */
export function getCurrentTimeString(timeZone: string = INSTITUTIONAL_POLICY.TIMEZONE): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(now); // "HH:mm"
}

/**
 * Formats a Date object or timestamp to readable local date and time string in IST.
 */
export function formatLocalDateTime(dateOrTimestamp: any): string {
  if (!dateOrTimestamp) return "-";
  let date: Date;

  if (typeof dateOrTimestamp.toDate === "function") {
    date = dateOrTimestamp.toDate();
  } else if (dateOrTimestamp instanceof Date) {
    date = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === "number" || typeof dateOrTimestamp === "string") {
    date = new Date(dateOrTimestamp);
  } else {
    return "-";
  }

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INSTITUTIONAL_POLICY.TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Checks if same-day registration for a given date is closed according to policy cutoff time.
 */
export function isRegistrationClosedForDate(
  scheduledDate: string,
  cutoffTime: string | null = INSTITUTIONAL_POLICY.REGISTRATION_CUTOFF_TIME,
  timeZone: string = INSTITUTIONAL_POLICY.TIMEZONE
): { isClosed: boolean; reason?: string } {
  const today = getTodayDateString(timeZone);

  // Past dates cannot be booked
  if (scheduledDate < today) {
    return {
      isClosed: true,
      reason: "Visitor registration cannot be booked for past dates.",
    };
  }

  // If registering for today and cutoff time is defined
  if (scheduledDate === today && cutoffTime && cutoffTime.trim() !== "") {
    const currentTime = getCurrentTimeString(timeZone);
    if (currentTime >= cutoffTime) {
      const [h, m] = cutoffTime.split(":");
      const hours12 = Number(h) % 12 || 12;
      const ampm = Number(h) >= 12 ? "PM" : "AM";
      const formattedCutoff = `${hours12}:${m} ${ampm}`;

      return {
        isClosed: true,
        reason: `Same-day visitor registration closed at ${formattedCutoff} IST. Please schedule your visit for a future date.`,
      };
    }
  }

  return { isClosed: false };
}
