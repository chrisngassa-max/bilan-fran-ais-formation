import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Calendar, FileText, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/bff/Button";
import type { ReactNode } from "react";

const NAV = [
  { to: "/mon-espace/ma-cohorte", label: "Ma cohorte", icon: GraduationCap },
  { to: "/mon-espace/mes-seances", label: "Mes séances", icon: Calendar },
  { to: "/mon-espace/mes-documents", label: "Mes documents", icon: FileText },
] as const;

export function ApprenantLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-surface-app py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Espace apprenant</h1>
            <p className="text-primary-foreground/80 text-sm">
              {user?.email ?? "Suivi de votre formation"}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition"
                activeProps={{ className: "px-3 py-2 rounded-lg bg-white text-primary text-sm font-semibold" }}
              >
                <item.icon className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {!loading && !user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-amber-900 mb-3">
              Vous devez être connecté(e) pour accéder à votre espace apprenant.
            </p>
            <Button variant="primary" asChild className="rounded-xl">
              <Link to="/login">
                <LogIn className="w-4 h-4" />
                Se connecter
              </Link>
            </Button>
          </div>
        )}

        {user && children}
      </div>
    </div>
  );
}

export function EmptyCohortCTA() {
  return (
    <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
      <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
      <h2 className="text-xl font-bold text-on-surface mb-2">
        Vous n'êtes inscrit(e) à aucune formation pour le moment.
      </h2>
      <p className="text-sm text-on-surface-variant mb-6">
        Découvrez nos prochaines sessions et réservez votre place.
      </p>
      <Button variant="primary" asChild className="rounded-xl">
        <Link to="/sessions">
          Voir les prochaines sessions
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}

export function formatDateFrLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
export function formatSlot(slot: { day: number; start: string; end: string }): string {
  return `${DAYS[slot.day] || "?"} ${formatTime(slot.start)} – ${formatTime(slot.end)}`;
}
