import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import VisitorQR from "../components/qr/VisitorQR";
import * as htmlToImage from "html-to-image";


export default function GuestRegister() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    purpose: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "",
  });

  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function downloadQR() {
  const node = document.getElementById("visitor-qr");

  if (!node) return;

  htmlToImage.toPng(node).then((dataUrl) => {
    const link = document.createElement("a");
    link.download = "visitor-qr.png";
    link.href = dataUrl;
    link.click();
  });
}


  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setError("");

    try {
      const docRef = await addDoc(
        collection(db, "visitors"),
        {
          ...form,
          status: "scheduled",
          createdAt: serverTimestamp(),
        }
      );

      setVisitorId(docRef.id);
      setSuccess(true);
    } catch {
      setError(
        "Registration failed. Please try again."
      );
    }
  }

if (success && visitorId) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DCC8] to-[#f5efe3] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-[var(--primary-brown)] mb-3">
          Registration Successful
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Please present this QR code at the entrance.
        </p>

        <div
          id="visitor-qr"
          className="flex justify-center mb-4"
        >
          <VisitorQR
            visitorId={visitorId}
            scheduledDate={form.scheduledDate}
          />
        </div>

        <button
          onClick={downloadQR}
          className="btn-secondary w-full mb-2"
        >
          Download QR Code
        </button>

        <p className="text-xs text-gray-500">
          Carry this QR on your visit day.
        </p>
        {/* return back to Registration page - simple redirect */}
        <button
          onClick={() => {
            setSuccess(false);
            setVisitorId(null);
            setForm({
              name: "",
              mobile: "",
              purpose: "",
              scheduledDate: "",
              scheduledTime: "",
              duration: "",
            });
          }}
          className="btn-primary w-full mt-2"
        >
          Register Another Visitor
        </button>
      </div>
    </div>
  );
}


  return (
<div className="min-h-screen bg-gradient-to-br from-[#E8DCC8] to-[#f5efe3] flex items-center justify-center px-4">
  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
    <h1 className="text-2xl font-bold text-center text-[var(--primary-brown)] mb-1">
      Visitor Registration
    </h1>

        <p className="text-center text-gray-600 mb-8">
          Please fill in your visit details
        </p>

        {error && (
          <p className="text-red-600 text-center mb-4">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {[
            {
              name: "name",
              label: "Full Name",
              type: "text",
            },
            {
              name: "mobile",
              label: "Mobile Number",
              type: "tel",
            },
            {
              name: "purpose",
              label: "Purpose of Visit",
              type: "text",
            },
            {
              name: "duration",
              label: "Expected Duration",
              type: "text",
            },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">
                {f.label}
              </label>
              <input
                name={f.name}
                type={f.type}
                required
                onChange={updateField}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-brown)]"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              name="scheduledDate"
              required
              onChange={updateField}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-brown)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Scheduled Time
            </label>
            <input
              type="time"
              name="scheduledTime"
              required
              onChange={updateField}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-brown)]"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-4"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
