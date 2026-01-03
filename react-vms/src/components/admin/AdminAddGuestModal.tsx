import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

interface Props {
  onClose: () => void;
}

export default function AdminAddGuestModal({ onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    purpose: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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
      await addDoc(collection(db, "visitors"), {
        ...form,
        status: "scheduled",
        createdAt: serverTimestamp(),
        createdBy: "admin",
      });
      onClose();
    } catch {
      setError("Failed to add guest");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-[var(--primary-brown)] mb-4">
          Manually Add Guest
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-2">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {[
            "name",
            "mobile",
            "purpose",
            "duration",
          ].map((f) => (
            <input
              key={f}
              name={f}
              placeholder={f}
              required
              onChange={updateField}
              className="w-full border rounded px-3 py-2"
            />
          ))}

          <input
            type="date"
            name="scheduledDate"
            required
            onChange={updateField}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="time"
            name="scheduledTime"
            required
            onChange={updateField}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              Add Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}