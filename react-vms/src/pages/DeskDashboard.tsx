import { useState } from "react";
import { logout } from "../services/auth.service";
import { useVisitors } from "../hooks/useVisitors";
import VisitorTable from "../components/visitors/VisitorTable";
import VisitorStats from "../components/visitors/VisitorStats";
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
    <div className="p-8">
      <div className="flex justify-between mb-4">
<div className="flex justify-between items-center mb-4">
  <h1 className="text-3xl font-bold">Desk Dashboard</h1>

  <div className="flex gap-3">
    <button
      onClick={() => navigate("/desk/scan")}
      className="bg-black text-white px-4 py-2 rounded"
    >
      Scan QR
    </button>

    <button
      onClick={logout}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  </div>
</div>
      </div>

      <VisitorStats
        scheduled={scheduled.length}
        checkedIn={checkedIn.length}
        checkedOut={checkedOut.length}
        inside={insideCount}
      />

      <VisitorFilters active={filter} onChange={setFilter} />

      {loading ? (
        <p>Loading visitors...</p>
      ) : (
        <VisitorTable visitors={filtered} />
      )}
      <div className="mt-8">
        <ActiveCardsTable />
      </div>
    </div>
  );
}
