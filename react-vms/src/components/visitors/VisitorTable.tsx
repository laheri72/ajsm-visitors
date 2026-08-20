import { useState } from "react";
import type { Visitor } from "../../models/Visitor";
import { checkInVisitor, checkOutVisitor, deleteVisitor } from "../../services/visitor.service";
import { validateCheckIn } from "../../utils/checkInValidator";
import { generateCardNumber } from "../../services/visitor.service";
import { activateCard } from "../../services/card.service";

interface Props {
  visitors: Visitor[];
  isAdmin?: boolean;
}

export default function VisitorTable({ visitors, isAdmin = false }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleCheckIn(visitor: Visitor) {
    if (processingId === visitor.id) return;

    const error = validateCheckIn(visitor);
    if (error) {
      alert(error);
      return;
    }

    setProcessingId(visitor.id);
    try {
      const cardNumber = await generateCardNumber();
      if (!cardNumber) {
        alert("Card number is required.");
        return;
      }

      await checkInVisitor(visitor.id, cardNumber);
      await activateCard(cardNumber, visitor.id);
    } catch {
      alert("Failed to check in visitor.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCheckOut(visitor: Visitor) {
    if (processingId === visitor.id) return;

    setProcessingId(visitor.id);
    try {
      await checkOutVisitor(visitor.id);
      alert(`Visitor ${visitor.name} checked out successfully.`);
    } catch {
      alert("Failed to check out visitor.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(visitor: Visitor) {
    if (visitor.status === "checked-out" || visitor.status === "checked-in") {
      alert("Completed or active visit records cannot be deleted. Preserved for institutional audit.");
      return;
    }

    if (
      !confirm(
        `Cancel & delete scheduled visit for ${visitor.name}? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteVisitor(visitor);
      alert("Scheduled visit record deleted.");
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 bg-white text-sm">
        <thead>
          <tr className="bg-[#3E2723] text-white">
            <th className="border p-3 text-left">Name</th>
            <th className="border p-3 text-left">Contact Info</th>
            <th className="border p-3 text-left">Purpose</th>
            <th className="border p-3 text-left">Scheduled Date</th>
            <th className="border p-3 text-left">Scheduled Time</th>
            <th className="border p-3 text-center">Status</th>
            <th className="border p-3 text-center">Visit Action</th>
            {isAdmin && <th className="border p-3 text-center">Admin Controls</th>}
          </tr>
        </thead>

        <tbody>
          {visitors.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} className="text-center p-6 text-gray-500">
                No visitor records found.
              </td>
            </tr>
          ) : (
            visitors.map((v) => (
              <tr key={v.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="border p-3 font-semibold text-[#3E2723]">{v.name}</td>
                <td className="border p-3">
                  <div>📞 {v.mobile}</div>
                  <div className="text-xs text-gray-600">✉️ {v.email || "N/A"}</div>
                </td>
                <td className="border p-3">{v.purpose}</td>
                <td className="border p-3 font-mono">{v.scheduledDate}</td>
                <td className="border p-3 font-mono">{v.scheduledTime}</td>
                <td className="border p-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      v.status === "scheduled"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : v.status === "checked-in"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="border p-3 text-center">
                  {v.status === "scheduled" && (
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleCheckIn(v)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition-colors"
                    >
                      Check In
                    </button>
                  )}

                  {v.status === "checked-in" && (
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleCheckOut(v)}
                      className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition-colors"
                    >
                      Check Out
                    </button>
                  )}

                  {v.status === "checked-out" && (
                    <span className="text-xs text-gray-500 font-medium">Completed</span>
                  )}
                </td>

                {isAdmin && (
                  <td className="border p-3 text-center">
                    {v.status === "checked-out" ? (
                      <span className="inline-block text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        🔒 Preserved (Completed)
                      </span>
                    ) : v.status === "checked-in" ? (
                      <span className="inline-block text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        Active Inside
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(v)}
                        className="text-red-700 hover:text-red-900 text-xs font-semibold underline"
                      >
                        Delete Scheduled
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
