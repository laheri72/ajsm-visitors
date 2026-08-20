import { useState } from "react";
import { createVisitor } from "../../services/visitor.service";

interface Props {
  onClose: () => void;
}

export default function AdminAddGuestModal({ onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    purpose: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "1 hour",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await createVisitor(form);
      alert(`Guest ${form.name} registered successfully. QR pass emailed to ${form.email}.`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add guest.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border-2 border-[#3E2723]">
        <h2 className="text-xl font-bold text-[#3E2723] mb-4">
          Manually Register Guest (Admin Override)
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 text-xs p-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              name="name"
              placeholder="e.g. Huzefa Merchant"
              required
              value={form.name}
              onChange={updateField}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
            <input
              name="mobile"
              type="tel"
              placeholder="10-digit mobile"
              required
              value={form.mobile}
              onChange={updateField}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="visitor@example.com"
              required
              value={form.email}
              onChange={updateField}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose of Visit</label>
            <input
              name="purpose"
              placeholder="e.g. Institutional Inquiry"
              required
              value={form.purpose}
              onChange={updateField}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date</label>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Time</label>
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

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#3E2723] hover:bg-[#2c1b18] rounded-lg shadow transition-colors"
            >
              {saving ? "Registering..." : "Add Guest & Send Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}