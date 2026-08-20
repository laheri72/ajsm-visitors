import { isRegistrationClosedForDate } from "./dateUtils";

export interface VisitorRegistrationInput {
  name: string;
  mobile: string;
  email: string;
  purpose: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: string;
}

export function validateRegistrationInput(
  input: VisitorRegistrationInput,
  cutoffTime?: string | null
): string | null {
  // 1. Name check
  if (!input.name || input.name.trim().length < 2) {
    return "Please enter a valid full name (at least 2 characters).";
  }

  // 2. Mobile check
  const cleanMobile = input.mobile ? input.mobile.replace(/\D/g, "") : "";
  if (!cleanMobile || cleanMobile.length < 10 || cleanMobile.length > 15) {
    return "Please enter a valid 10-digit mobile number.";
  }

  // 3. Email check
  if (!input.email || !input.email.includes("@") || !input.email.includes(".")) {
    return "Please enter a valid email address for receiving your QR code pass.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email.trim())) {
    return "Please enter a properly formatted email address (e.g., visitor@example.com).";
  }

  // 4. Purpose check
  if (!input.purpose || input.purpose.trim().length < 2) {
    return "Please specify the purpose of your visit.";
  }

  // 5. Scheduled Date check
  if (!input.scheduledDate) {
    return "Please select a scheduled date for your visit.";
  }

  // 6. Scheduled Time check
  if (!input.scheduledTime) {
    return "Please select a scheduled time for your visit.";
  }

  // 7. Policy Cutoff Time check (timezone-aware with dynamic cutoffTime)
  const cutoffCheck = isRegistrationClosedForDate(input.scheduledDate, cutoffTime);
  if (cutoffCheck.isClosed) {
    return cutoffCheck.reason || "Same-day registration is closed after cutoff time.";
  }

  return null;
}
