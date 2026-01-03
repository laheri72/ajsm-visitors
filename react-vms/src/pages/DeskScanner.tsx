import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getVisitorById, checkInVisitor } from "../services/visitor.service";
import { validateCheckIn } from "../utils/checkInValidator";
import { validateQRPayload } from "../utils/qrValidator";
import { generateCardNumber } from "../services/visitor.service";
import { useNavigate } from "react-router-dom";
import { activateCard } from "../services/card.service";



export default function DeskScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
    const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      const elementId = "qr-reader";

      // Wait one tick to ensure DOM exists
      await new Promise((r) => setTimeout(r, 0));

      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          console.error("No cameras found");
          return;
        }

        const backCamera =
          cameras.find((d) =>
            d.label.toLowerCase().includes("back")
          ) || cameras[0];

        await scanner.start(
          backCamera.id,
          { fps: 10, qrbox: 250 },
async (decodedText) => {
  if (!startedRef.current) return;
  startedRef.current = false;

  try {
    const payload = JSON.parse(decodedText);

    const qrError = validateQRPayload(payload);
    if (qrError) {
      alert(qrError);
      return;
    }

    const visitor = await getVisitorById(payload.visitorId);
    if (!visitor) {
      alert("Visitor not found.");
      return;
    }

    const checkInError = validateCheckIn(visitor);
    if (checkInError) {
      alert(checkInError);
      return;
    }

    // 🔴 STOP CAMERA FIRST
    await scannerRef.current?.stop();
    scannerRef.current?.clear();
    scannerRef.current = null;

    const cardNumber = await generateCardNumber();
    await checkInVisitor(visitor.id, cardNumber);
    await activateCard(cardNumber, visitor.id);

    alert(`Visitor checked in.\nCard issued: ${cardNumber}`);
    navigate("/desk");

  } catch (err) {
    alert("Invalid QR code.");
  }
},
(errorMessage) => {
  // Handle QR code scanning errors
  console.error("QR Code scan error:", errorMessage);
}
        );


        startedRef.current = true;
      } catch (err) {
        console.error("Failed to start scanner", err);
      }
    }

    startScanner();

    return () => {
      isMounted = false;

      if (scannerRef.current && startedRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
            startedRef.current = false;
          })
          .catch(() => {
            // Ignore stop errors (StrictMode)
          });
      }
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Desk QR Scanner
      </h1>
      <div
        id="qr-reader"
        className="w-full max-w-md border rounded"
      />
    </div>
  );
}
