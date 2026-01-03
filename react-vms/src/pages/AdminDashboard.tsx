import { useState } from "react";
import { logout } from "../services/auth.service";
import { useVisitors } from "../hooks/useVisitors";
import VisitorTable from "../components/visitors/VisitorTable";
import AdminCardsTable from "../components/cards/AdminCardsTable";
import AdminAddGuestModal from "../components/admin/AdminAddGuestModal";

export default function AdminDashboard() {
  const { visitors, loading } = useVisitors();

  const visitorMap = Object.fromEntries(
    visitors.map(v => [v.id, v.name])
  );

  const [showAddGuest, setShowAddGuest] = useState(false);

  /* ================= ADMIN ACTION HANDLERS ================= */


  function handleManualAdd() {
    setShowAddGuest(true);
  }

  function handleForceCheckout() {
    alert("Force Checkout – admin override (next step)");
  }


  function exportVisitorsToCSV(visitors: any[]) {
  if (!visitors || visitors.length === 0) {
    alert("No visitors to export");
    return;
  }

  const headers = [
    "Visitor ID",
    "Name",
    "Mobile",
    "Purpose",
    "Scheduled Date",
    "Scheduled Time",
    "Status",
    "Card Number",
    "Check In Time",
    "Check Out Time",
  ];

  const rows = visitors.map((v) => [
    v.id,
    v.name || "",
    v.mobile || "",
    v.purpose || "",
    v.scheduledDate || "",
    v.scheduledTime || "",
    v.status || "",
    v.cardNumber || "",
    v.checkInTime?.toDate
      ? v.checkInTime.toDate().toLocaleString()
      : "",
    v.checkOutTime?.toDate
      ? v.checkOutTime.toDate().toLocaleString()
      : v.checkOutTime || "",
  ]);

  const csvContent =
    [headers, ...rows]
      .map((e) =>
        e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `visitors_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  link.click();
  URL.revokeObjectURL(url);
}

  /* ========================================================== */



  return (
    <div className="min-h-screen bg-[#f5efe3] px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary-brown)]">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Visitor oversight and system control
          </p>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full md:w-auto"
        >
          Logout
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleManualAdd}
            className="btn-primary text-sm"
          >
            + Add Guest
          </button>



          <button
            onClick={() => exportVisitorsToCSV(visitors)}
            className="btn-primary text-sm"
          >
            Export CSV
          </button>

                    <button
            onClick={handleForceCheckout}
            className="btn-primary text-sm"
          >
            Force Check-out
          </button>

        </div>
      </div>

      {/* Visitors Section */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-10">
        <h2 className="text-xl font-semibold text-[var(--primary-brown)] mb-4">
          Visitors
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading visitors…</p>
        ) : (
          <div className="overflow-x-auto">
            <VisitorTable visitors={visitors} isAdmin={true} />
          </div>
        )}
      </div>

      {/* Card Management */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <AdminCardsTable visitorMap={visitorMap} />
      </div>

      {showAddGuest && (
        <AdminAddGuestModal
          onClose={() => setShowAddGuest(false)}
        />
      )}
    </div>
  );
}
