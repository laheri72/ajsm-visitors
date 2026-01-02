import type { Visitor } from "../../models/Visitor";
import { checkInVisitor, checkOutVisitor } from "../../services/visitor.service";
import {
  validateCheckIn,
  validateCheckOut,
} from "../../utils/checkInValidator";
import { generateCardNumber } from "../../services/visitor.service";
import { activateCard } from "../../services/card.service";
import { releaseCard } from "../../services/card.service";




interface Props {
  visitors: Visitor[];
}

export default function VisitorTable({ visitors }: Props) {
  async function handleCheckIn(visitor: Visitor) {
    const error = validateCheckIn(visitor);
    if (error) {
      alert(error);
      return;
    }

    const cardNumber = await generateCardNumber();
  

    await checkInVisitor(visitor.id, cardNumber);
    await activateCard(cardNumber, visitor.id);

    if (!cardNumber) {
      alert("Card number is required.");
      return;
    }

    try {
      await checkInVisitor(visitor.id, cardNumber);
      await activateCard(cardNumber, visitor.id);
    } catch (err) {
      alert("Failed to check in visitor.");
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
                  onClick={() => handleCheckIn(v)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Check In
                </button>
              )}

              {v.status === "checked-in" && (
                <button
                  onClick={() => handleCheckOut(v)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Check Out
                </button>
              )}

              {v.status === "checked-out" && "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function handleCheckOut(visitor: Visitor) {
  const error = validateCheckOut(visitor);
  if (error) {
    alert(error);
    return;
  }

  if (!confirm("Confirm check-out?")) return;

  try {
    await checkOutVisitor(visitor.id);
    if (visitor.cardNumber) {
  await releaseCard(visitor.cardNumber);
}
  } catch {
    alert("Failed to check out visitor.");
  }
}

