import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { 
  Users, 
  Handshake, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  GraduationCap, 
  LayoutDashboard,
  ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isGestionnaire, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isGestionnaire)) {
      navigate({ to: "/login" });
    }
  }, [user, isGestionnaire, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          <p className="text-sm font-bold text-on-surface-variant animate-pulse">Vérification de vos droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!user || !isGestionnaire) {
    return null; // Will redirect in useEffect
  }

  const menuItems = [
    { label: "Prospects & Dossiers", to: "/admin/leads", icon: Users },
    { label: "Partenaires Agréés", to: "/admin/partenaires", icon: Handshake },
    { label: "Pilotage & KPI", to: "/admin/reporting", icon: BarChart3 },
    { label: "Équipe Conseillers", to: "/admin/users", icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col md:flex-row relative">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-6 h-16 bg-[#2c1d1a] text-white border-b border-[#3e2e2a] sticky top-[72px] z-30">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-primary-container" />
          <span className="font-extrabold text-sm tracking-wider uppercase">BFF Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-1 hover:bg-[#3e2e2a] rounded">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 md:top-[72px] left-0 h-[calc(100vh-72px)] w-72 bg-[#2c1d1a] text-white border-r border-[#3e2e2a] 
        flex flex-col justify-between p-6 z-40 transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="space-y-8">
          <div className="hidden md:flex items-center gap-3 pb-6 border-b border-[#3e2e2a]">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black">
              B
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide uppercase text-white">Espace Admin</h2>
              <p className="text-[10px] text-outline-variant font-bold uppercase tracking-widest mt-0.5">Pilotage National</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group
                    ${active 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "text-outline-variant hover:bg-[#3e2e2a] hover:text-white"
                    }
                  `}
                >
                  <item.icon size={18} className={`${active ? "text-white" : "text-outline-variant group-hover:text-white"}`} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${active ? "text-white" : "text-outline-variant"}`} />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#3e2e2a] flex flex-col gap-4">
          <div className="px-2">
            <p className="text-xs font-semibold text-outline-variant truncate">Connecté en tant que :</p>
            <p className="text-xs font-bold text-white truncate mt-0.5">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#3e2e2a] hover:bg-red-950/40 hover:text-red-300 font-bold text-sm transition-colors text-outline-variant"
          >
            <LogOut size={18} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
}
