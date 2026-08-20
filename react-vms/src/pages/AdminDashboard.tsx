import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/dateUtils";
import { logout } from "../services/auth.service";
import { useVisitors } from "../hooks/useVisitors";
import VisitorTable from "../components/visitors/VisitorTable";
import AdminCardsTable from "../components/cards/AdminCardsTable";
import AdminAddGuestModal from "../components/admin/AdminAddGuestModal";
import { checkOutVisitor } from "../services/visitor.service";
import type { Visitor } from "../models/Visitor";
import { listenToPolicySettings, updatePolicyCutoffTime } from "../services/policy.service";

export default function AdminDashboard() {
  const { visitors, checkedIn, loading } = useVisitors();

  const visitorMap = Object.fromEntries(
    visitors.map((v) => [v.id, v.name])
  );

  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showForceCheckoutModal, setShowForceCheckoutModal] = useState(false);
  const [selectedForceCheckoutId, setSelectedForceCheckoutId] = useState("");
  const [actionProcessing, setActionProcessing] = useState(false);

  // Policy Cutoff State
  const [cutoffTime, setCutoffTime] = useState<string>("17:00");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = listenToPolicySettings((settings) => {
      setCutoffTime(settings.cutoffTime || "");
    });
    return unsubscribe;
  }, []);

  async function handleSavePolicy() {
    setSavingPolicy(true);
    setPolicyMessage("");
    try {
      await updatePolicyCutoffTime(cutoffTime);
      setPolicyMessage("✅ Registration cutoff time updated successfully!");
      setTimeout(() => setPolicyMessage(""), 4000);
    } catch (err: any) {
      setPolicyMessage("❌ Failed to update cutoff time: " + err.message);
    } finally {
      setSavingPolicy(false);
    }
  }

  function handleManualAdd() {
    setShowAddGuest(true);
  }

  async function handleExecuteForceCheckout() {
    if (!selectedForceCheckoutId) {
      alert("Please select a checked-in visitor to force check-out.");
      return;
    }

    const visitor = visitors.find((v) => v.id === selectedForceCheckoutId);
    if (!visitor) return;

    if (!confirm(`Are you sure you want to force check-out ${visitor.name}?`)) {
      return;
    }

    setActionProcessing(true);
    try {
      await checkOutVisitor(visitor.id);
      alert(`Visitor ${visitor.name} has been force checked-out successfully.`);
      setShowForceCheckoutModal(false);
      setSelectedForceCheckoutId("");
    } catch (err: any) {
      alert(err.message || "Failed to force check-out visitor.");
    } finally {
      setActionProcessing(false);
    }
  }

  function exportVisitorsToCSV(visitorList: Visitor[]) {
    if (!visitorList || visitorList.length === 0) {
      alert("No visitors to export");
      return;
    }

    const headers = [
      "Visitor ID",
      "Name",
      "Mobile",
      "Email",
      "Purpose",
      "Scheduled Date",
      "Scheduled Time",
      "Status",
      "Card Number",
      "Check In Time",
      "Check Out Time",
    ];

    const rows = visitorList.map((v) => [
      v.id,
      v.name || "",
      v.mobile || "",
      v.email || "",
      v.purpose || "",
      v.scheduledDate || "",
      v.scheduledTime || "",
      v.status || "",
      v.cardNumber || "",
      formatLocalDateTime(v.checkInTime),
      formatLocalDateTime(v.checkOutTime),
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ajsm_visitors_${new Date().toISOString().slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f5efe3] px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#3E2723]">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Al-Jamea-tus-Saifiyah Visitor Oversight & System Control
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-[#3E2723] hover:bg-[#2c1b18] text-white px-5 py-2.5 rounded-lg font-medium shadow transition-colors w-full md:w-auto"
        >
          Logout
        </button>
      </div>

      {/* Dynamic Institutional Policy Settings Section */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6 border-2 border-[#3E2723]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#3E2723] flex items-center gap-2">
              <span>🕒</span> Institutional Registration Cutoff Policy
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Set the daily cutoff time for same-day guest registrations (IST). Visitors cannot book same-day slots after this time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Cutoff Time:</label>
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
              />
            </div>

            <button
              type="button"
              onClick={() => setCutoffTime("")}
              className="text-xs text-gray-600 hover:text-gray-900 underline px-2"
              title="Clear cutoff time to allow same-day registration at any hour"
            >
              Disable Cutoff
            </button>

            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="bg-[#3E2723] hover:bg-[#2c1b18] text-[#E8DCC8] text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors"
            >
              {savingPolicy ? "Saving..." : "Save Policy"}
            </button>
          </div>
        </div>

        {policyMessage && (
          <p className="text-xs font-semibold mt-2.5 transition-all">
            {policyMessage}
          </p>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8 border border-amber-900/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleManualAdd}
            className="bg-[#3E2723] hover:bg-[#2c1b18] text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors text-sm flex items-center justify-center gap-2"
          >
            ➕ Add Guest (Admin Override)
          </button>

          <button
            onClick={() => exportVisitorsToCSV(visitors)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors text-sm flex items-center justify-center gap-2"
          >
            📥 Export Visitors CSV
          </button>

          <button
            onClick={() => setShowForceCheckoutModal(true)}
            className="bg-amber-800 hover:bg-amber-900 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors text-sm flex items-center justify-center gap-2"
          >
            ⚠️ Force Check-out Active Visitor
          </button>
        </div>
      </div>

      {/* Visitors Section */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-10 border border-amber-900/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#3E2723]">
            Visitor Records
          </h2>
          <span className="text-xs text-gray-500 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
            🔒 Completed records preserved for audit
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3E2723] mr-2"></div>
            Loading visitor records…
          </div>
        ) : (
          <VisitorTable visitors={visitors} isAdmin={true} />
        )}
      </div>

      {/* Card Management */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-amber-900/10">
        <AdminCardsTable visitorMap={visitorMap} />
      </div>

      {/* Add Guest Modal */}
      {showAddGuest && (
        <AdminAddGuestModal onClose={() => setShowAddGuest(false)} />
      )}

      {/* Force Checkout Modal */}
      {showForceCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-2 border-[#3E2723]">
            <h3 className="text-lg font-bold text-[#3E2723] mb-2">
              Administrative Force Check-Out
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Select an active visitor currently checked inside to force release their pass and badge.
            </p>

            {checkedIn.length === 0 ? (
              <p className="text-sm text-gray-500 my-4 text-center">
                There are currently no active checked-in visitors.
              </p>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Visitor Inside:
                </label>
                <select
                  value={selectedForceCheckoutId}
                  onChange={(e) => setSelectedForceCheckoutId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                >
                  <option value="">-- Choose active visitor --</option>
                  {checkedIn.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Card: {v.cardNumber || "N/A"}) — Mobile: {v.mobile}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForceCheckoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {checkedIn.length > 0 && (
                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={handleExecuteForceCheckout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow transition-colors"
                >
                  {actionProcessing ? "Processing..." : "Force Check-out"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
