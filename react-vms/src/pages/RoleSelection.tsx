import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DCC8] to-[#f5efe3] flex items-center justify-center px-6">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-center text-[var(--primary-brown)] mb-12">
          Select Your Role
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Admin Card */}
          <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center">
            <div className="text-6xl mb-6">🛡️</div>

            <h2 className="text-2xl font-semibold text-[var(--primary-brown)] mb-4">
              Administrator
            </h2>

            <p className="text-gray-600 mb-8">
              Full access to visitors, cards, and system management.
            </p>

            <button
              onClick={() => navigate("/login/admin")}
              className="btn-secondary"
            >
              Continue as Admin
            </button>
          </div>

          {/* Desk Card */}
          <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center">
            <div className="text-6xl mb-6">📋</div>

            <h2 className="text-2xl font-semibold text-[var(--primary-brown)] mb-4">
              Desk Personnel
            </h2>

            <p className="text-gray-600 mb-8">
              Check-in visitors, scan QR codes, and manage card issuance.
            </p>

            <button
              onClick={() => navigate("/login/desk")}
              className="btn-secondary"
            >
              Continue as Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
