import { useEffect, useState } from "react";
import {
  listenActiveCards,
  forceReleaseCard,
  markCardLost,
  disableCard,
} from "../../services/card.service";

interface Card {
  id: string;
  cardNumber: string;
  assignedTo: string | null;
  status: string;
}

export default function AdminCardsTable({ visitorMap }: { visitorMap: Record<string, string> }) {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const unsub = listenActiveCards(setCards);
    return () => unsub();
  }, []);

  async function handleAction(
    card: Card,
    action: "release" | "lost" | "disable"
  ) {
    if (
      !confirm(
        `Confirm ${action} for card ${card.cardNumber}?`
      )
    )
      return;

    if (action === "release")
      await forceReleaseCard(card.cardNumber);
    if (action === "lost")
      await markCardLost(card.cardNumber);
    if (action === "disable")
      await disableCard(card.cardNumber);
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">
        Card Management
      </h2>

      {cards.length === 0 ? (
        <p className="text-gray-500">
          No active cards.
        </p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Card</th>
              <th className="border p-2">Visitor</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id}>
                <td className="border p-2 font-mono">
                  {c.cardNumber}
                </td>
                <td className="border p-2">
                  {c.assignedTo ? visitorMap[c.assignedTo] : "-"}
                </td>
                <td className="border p-2 flex gap-2">
                  <button
                    onClick={() =>
                      handleAction(c, "release")
                    }
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Unassign
                  </button>
                  <button
                    onClick={() =>
                      handleAction(c, "lost")
                    }
                    className="bg-yellow-600 text-white px-2 py-1 rounded"
                  >
                    Lost
                  </button>
                  <button
                    onClick={() =>
                      handleAction(c, "disable")
                    }
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
