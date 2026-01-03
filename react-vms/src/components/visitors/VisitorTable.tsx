import { useState } from "react";
import type { Visitor } from "../../models/Visitor";
import { checkInVisitor, checkOutVisitor, deleteVisitor } from "../../services/visitor.service";
import {
  validateCheckIn,
} from "../../utils/checkInValidator";
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
      alert("Visitor checked out");
    } catch {
      alert("Failed to check out");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(visitor: Visitor) {
    if (
      !confirm(
        `Delete visitor ${visitor.name}? This cannot be undone.`
      )
    )
      return;

    try {
      await deleteVisitor(visitor);
      alert("Visitor deleted");
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Name</th>
          <th className="border p-2">Mobile</th>
          <th className="border p-2">Purpose</th>
          <th className="border p-2">Date</th>
          <th className="border p-2">Time</th>
          <th className="border p-2">Status</th>
          <th className="border p-2">Action</th>
          {isAdmin && <th className="border p-2">Admin</th>}
        </tr>
      </thead>

      <tbody>
        {visitors.map((v) => (
          <tr key={v.id}>
            <td className="border p-2">{v.name}</td>
            <td className="border p-2">{v.mobile}</td>
            <td className="border p-2">{v.purpose}</td>
            <td className="border p-2">{v.scheduledDate}</td>
            <td className="border p-2">{v.scheduledTime}</td>
            <td className="border p-2">{v.status}</td>
            <td className="border p-2">
              {v.status === "scheduled" && (
                <button
                  disabled={processingId === v.id}
                  onClick={() => handleCheckIn(v)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Check In
                </button>
              )}

              {v.status === "checked-in" && (
                <button
                  disabled={processingId === v.id}
                  onClick={() => handleCheckOut(v)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Check Out
                </button>
              )}

              {v.status === "checked-out" && "-"}
            </td>
            {isAdmin && (
              <td className="border p-2">
                <button
                  onClick={() => handleDelete(v)}
                  className="text-red-600 text-sm underline"
                >
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

