import { QRCodeCanvas } from "qrcode.react";

interface Props {
  visitorId: string;
  scheduledDate: string;
}

export default function VisitorQR({ visitorId, scheduledDate }: Props) {
  const payload = JSON.stringify({
    visitorId,
    scheduledDate,
  });

  return (
    <div className="text-center">
      <QRCodeCanvas value={payload} size={220} />
      <p className="mt-2 text-sm text-gray-600">
        Show this QR at the desk
      </p>
    </div>
  );
}
