export function validateQRPayload(payload: any): string | null {
  if (!payload.visitorId || !payload.scheduledDate) {
    return "Invalid QR code.";
  }

  const today = new Date().toISOString().split("T")[0];
  if (payload.scheduledDate !== today) {
    return "QR code is not valid for today.";
  }

  return null;
}
