import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const navigate = useNavigate();
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://jameasaifiyah.edu/wp-content/uploads/2024/07/AJSM-05BaabShot2_FW.jpg')",
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-[#3E2723]/90 to-[#E8DCC8]/80 flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow">
            Welcome to Al-Jamea-tus-Saifiyah
          </h1>

          <p className="text-xl md:text-2xl text-white mb-2 drop-shadow">
            Marol, Mumbai
          </p>

          <p className="text-lg md:text-xl text-white mb-12 drop-shadow">
            Visitor Management System
          </p>

          <button
            onClick={() => navigate("/roles")}
            className="btn-primary"
          >
            Proceed
          </button>

        </div>
      </div>
    </div>
  );
}
