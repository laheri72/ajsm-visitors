import { useState } from "react";
import { login } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [email] = useState("admin@ajsm.edu");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already logged in → redirect
  if (role === "ADMIN") {
    navigate("/admin");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          type="email"
          className="border w-full p-2 mb-3"
          value={email}
          disabled
        />

        <input
          type="password"
          className="border w-full p-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white py-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
