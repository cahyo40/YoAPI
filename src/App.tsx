import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import History from "./pages/History.tsx";
import Login from "./pages/Login.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}
