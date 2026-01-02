import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "../pages/Welcome";
import RoleSelection from "../pages/RoleSelection";
import AdminLogin from "../pages/AdminLogin";
import DeskLogin from "../pages/DeskLogin";
import AdminDashboard from "../pages/AdminDashboard";
import DeskDashboard from "../pages/DeskDashboard";
import ProtectedRoute from "./ProtectedRoute";
import GuestRegister from "../pages/GuestRegister";
import DeskScanner from "../pages/DeskScanner";



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/desk" element={<DeskLogin />} />
        <Route path="/guest" element={<GuestRegister />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/desk"
          element={
            <ProtectedRoute allow={["DESK"]}>
              <DeskDashboard />
            </ProtectedRoute>
          }
        />
        <Route
        path="/desk/scan"
        element={
          <ProtectedRoute allow={["DESK"]}>
            <DeskScanner />
          </ProtectedRoute>
        }
      />
      </Routes>
    </BrowserRouter>
  );
}
