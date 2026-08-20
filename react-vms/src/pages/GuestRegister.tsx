import { useState, useEffect } from "react";
import VisitorQR from "../components/qr/VisitorQR";
import * as htmlToImage from "html-to-image";
import { createVisitor } from "../services/visitor.service";
import { isRegistrationClosedForDate } from "../utils/dateUtils";
import { INSTITUTIONAL_POLICY } from "../config/policy.config";
import { listenToPolicySettings } from "../services/policy.service";

export default function GuestRegister() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    purpose: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "1 hour",
  });

  const [activeCutoffTime, setActiveCutoffTime] = useState<string | null>("17:00");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cutoffWarning, setCutoffWarning] = useState<string | null>(null);

  // Subscribe to real-time institutional policy cutoff time set by Admin
  useEffect(() => {
    const unsub = listenToPolicySettings((settings) => {
      setActiveCutoffTime(settings.cutoffTime);
    });
    return unsub;
  }, []);

  // Re-evaluate cutoff when form scheduledDate or activeCutoffTime changes
  useEffect(() => {
    if (form.scheduledDate) {
      const cutoffCheck = isRegistrationClosedForDate(form.scheduledDate, activeCutoffTime);
      if (cutoffCheck.isClosed) {
        setCutoffWarning(cutoffCheck.reason || "Same-day registration is closed after cutoff time.");
      } else {
        setCutoffWarning(null);
      }
    }
  }, [form.scheduledDate, activeCutoffTime]);

  function updateField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function downloadQR() {
    const node = document.getElementById("visitor-qr");
    if (!node) return;

    htmlToImage.toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `visitor-pass-${form.name.toLowerCase().replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await createVisitor(form, activeCutoffTime);
      setVisitorId(result.visitorId);
      setEmailStatus(result.emailResult.message);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success && visitorId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8DCC8] to-[#f5efe3] flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center border-2 border-[#3E2723]">
          {/* Institutional Badge */}
          <div className="inline-block bg-[#3E2723] text-[#E8DCC8] text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            {INSTITUTIONAL_POLICY.INSTITUTION_NAME}
          </div>

          <h2 className="text-2xl font-bold text-[#3E2723] mb-2">
            Registration Successful!
          </h2>

          {/* Primary QR Delivery Callout */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 my-4 text-left">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <span>📧</span>
              <span>QR Pass Sent to Email</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your official QR pass has been sent to <strong>{form.email}</strong>. Please check your email inbox to view your pass on your visit day.
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-mono">
              Status: {emailStatus}
            </p>
          </div>

          {/* Secondary Backup QR Display */}
          <div className="my-4 p-4 bg-gray-50 rounded-xl border border-dashed border-[#3E2723]/30">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              QR Code Preview & Backup Download
            </p>
            <div id="visitor-qr" className="flex justify-center bg-white p-3 rounded-lg shadow-inner inline-block">
              <VisitorQR visitorId={visitorId} scheduledDate={form.scheduledDate} />
            </div>
          </div>

          <button
            onClick={downloadQR}
            className="w-full bg-[#3E2723] hover:bg-[#2c1b18] text-white py-3 px-4 rounded-xl font-semibold text-sm shadow transition-colors mb-3 flex items-center justify-center gap-2"
          >
            📥 Download QR Pass Image (Backup)
          </button>

          <button
            onClick={() => {
              setSuccess(false);
              setVisitorId(null);
              setForm({
                name: "",
                mobile: "",
                email: "",
                purpose: "",
                scheduledDate: "",
                scheduledTime: "",
                duration: "1 hour",
              });
              setCutoffWarning(null);
            }}
            className="w-full bg-amber-100 hover:bg-amber-200 text-[#3E2723] py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors border border-amber-300"
          >
            Register Another Visitor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DCC8] to-[#f5efe3] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md border border-amber-900/10">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#3E2723] mb-1">
            Visitor Registration
          </h1>
          <p className="text-xs text-gray-600 font-medium">
            {INSTITUTIONAL_POLICY.INSTITUTION_NAME} — Marol, Mumbai
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-xs p-3.5 rounded-xl mb-4 text-left leading-relaxed">
            <strong>⚠️ Registration Notice:</strong>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {cutoffWarning && (
          <div className="bg-amber-50 border border-amber-400 text-amber-900 text-xs p-3.5 rounded-xl mb-4 text-left leading-relaxed">
            <strong>🕒 Registration Policy Notice:</strong>
            <p className="mt-1">{cutoffWarning}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#3E2723] mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Ali Asghar"
              value={form.name}
              onChange={updateField}
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3E2723] mb-1">
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              name="mobile"
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={form.mobile}
              onChange={updateField}
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
            <p className="text-[11px] text-gray-500 mt-0.5">Must be unique per visitor (24h barricading policy).</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3E2723] mb-1">
              Email Address (Primary QR Pass Delivery) <span className="text-red-600">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="visitor@example.com"
              value={form.email}
              onChange={updateField}
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
            <p className="text-[11px] text-gray-500 mt-0.5">Your entry QR pass will be emailed to this address.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3E2723] mb-1">
              Purpose of Visit <span className="text-red-600">*</span>
            </label>
            <input
              name="purpose"
              type="text"
              required
              placeholder="e.g. Official Meeting / Academic Query"
              value={form.purpose}
              onChange={updateField}
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3E2723] mb-1">
                Scheduled Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="scheduledDate"
                required
                value={form.scheduledDate}
                onChange={updateField}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3E2723] mb-1">
                Scheduled Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="scheduledTime"
                required
                value={form.scheduledTime}
                onChange={updateField}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3E2723] mb-1">
              Expected Duration
            </label>
            <select
              name="duration"
              value={form.duration}
              onChange={updateField}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            >
              <option value="30 mins">30 mins</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="Half Day">Half Day</option>
              <option value="Full Day">Full Day</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !!cutoffWarning}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow transition-colors mt-4 ${
              cutoffWarning
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[#3E2723] hover:bg-[#2c1b18] text-[#E8DCC8]"
            }`}
          >
            {submitting ? "Processing Registration..." : "Submit Registration & Send QR Pass"}
          </button>
        </form>

        <p className="text-[11px] text-gray-500 mt-4 text-center">
          Note: Registration cutoff policy is managed dynamically by Institutional Admins.
        </p>
      </div>
    </div>
  );
}
