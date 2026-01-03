import { useEffect, useState } from "react";
import { listenActiveCards } from "../../services/card.service";

interface Card {
  id: string;
  cardNumber: string;
  assignedTo: string;
  assignedAt: any;
}

export default function ActiveCardsTable({ visitorMap }: { visitorMap: Record<string, string> }) {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const unsub = listenActiveCards(setCards);
    return () => unsub();
  }, []);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">
        Active Cards
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
              <th className="border p-2">Issued At</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id}>
                <td className="border p-2 font-mono">
                  {c.cardNumber}
                </td>
                <td className="border p-2">
                  {visitorMap[c.assignedTo] || "-"}
                </td>
                <td className="border p-2">
                  {c.assignedAt?.toDate
                    ? c.assignedAt.toDate().toLocaleTimeString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
