import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import PublicPortal from "./pages/PublicPortal";
import ModeratorLogin from "./pages/ModeratorLogin";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import { Splash } from "./components/Shell";

function Guard({ needAdmin, children }) {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  if (isLoading) return <Splash>Checking session…</Splash>;
  if (!user) return <ModeratorLogin />;
  if (needAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-sm p-8">
        <h1 className="font-display text-2xl font-bold text-ink">Admins only</h1>
        <p className="mt-2 text-sm text-soft">{user.email} is not an admin. Ask an existing admin to add you.</p>
        <button onClick={signOut} className="mt-4 min-h-12 rounded-xl bg-forest px-5 font-semibold text-white">Sign out</button>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/moderator" element={<Guard><ModeratorDashboard /></Guard>} />
          <Route path="/admin" element={<Guard needAdmin><AdminLayout /></Guard>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
