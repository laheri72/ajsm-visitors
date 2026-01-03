import { useState } from "react";
import { logout } from "../services/auth.service";
import { useVisitors } from "../hooks/useVisitors";
import VisitorTable from "../components/visitors/VisitorTable";
import VisitorFilters from "../components/visitors/VisitorFilters";
import { useNavigate } from "react-router-dom";
import ActiveCardsTable from "../components/cards/ActiveCardsTable";



export default function DeskDashboard() {
  const {
    visitors,
    scheduled,
    checkedIn,
    checkedOut,
    insideCount,
    loading,
  } = useVisitors();

  const visitorMap = Object.fromEntries(
    visitors.map(v => [v.id, v.name])
  );

  const navigate = useNavigate();

  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "scheduled"
      ? scheduled
      : filter === "checked-in"
      ? checkedIn
      : filter === "checked-out"
      ? checkedOut
      : visitors;

  return (
    <div className="min-h-screen bg-[#f5efe3] px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary-brown)]">
            Reception Desk
          </h1>
          <p className="text-gray-600 mt-1">
            Manage visitor check-ins and monitor active cards
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/desk/scan")}
            className="bg-[var(--primary-brown)] hover:bg-[var(--primary-brown-dark)] text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2"
          >
            📱 Scan QR Code
          </button>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium shadow-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{scheduled.length}</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{checkedIn.length}</div>
          <div className="text-sm text-gray-600">Checked In</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{checkedOut.length}</div>
          <div className="text-sm text-gray-600">Checked Out</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{insideCount}</div>
          <div className="text-sm text-gray-600">Currently Inside</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <VisitorFilters active={filter} onChange={setFilter} />
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-8">
        <h2 className="text-xl font-semibold text-[var(--primary-brown)] mb-4">
          Visitor Management
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-brown)]"></div>
            <span className="ml-2 text-gray-600">Loading visitors...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <VisitorTable visitors={filtered} isAdmin={false} />
          </div>
        )}
      </div>

      {/* Active Cards */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-[var(--primary-brown)] mb-4">
          Active Visitor Cards
        </h2>
        <ActiveCardsTable visitorMap={visitorMap} />
      </div>
    </div>
  );
}
