import { getTodayDateString } from "./dateUtils";

export function validateQRPayload(payload: any): string | null {
  if (!payload.visitorId || !payload.scheduledDate) {
    return "Invalid QR code payload.";
  }

  const today = getTodayDateString();
  if (payload.scheduledDate !== today) {
    return `QR code is issued for ${payload.scheduledDate}, but today is ${today}.`;
  }

  return null;
}
