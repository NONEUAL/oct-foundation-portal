import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import PublicPortal from "./pages/PublicPortal";
import ModeratorLogin from "./pages/ModeratorLogin";
import ModeratorDashboard from "./pages/ModeratorDashboard";

function ModeratorRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-court">
        <p className="font-mono text-sm text-mute">Checking session…</p>
      </div>
    );
  }

  return user ? <ModeratorDashboard /> : <ModeratorLogin />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/moderator" element={<ModeratorRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
