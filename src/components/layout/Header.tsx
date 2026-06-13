import { Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Menu, X, GraduationCap, Banknote, Calendar } from "lucide-react";
import { Button } from "@/components/bff/Button";

export function Header() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handlePopState = () => setOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:font-bold"
      >
        Aller au contenu principal
      </a>
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40">
        <nav className="max-w-[1200px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between" aria-label="Navigation principale">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <GraduationCap className="text-primary h-8 w-8" aria-hidden />
            <div className="flex flex-col">
              <span className="font-headline-md text-[20px] font-bold text-primary leading-tight">
                Bilan Français Formation
              </span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                Votre niveau, votre parcours, vos démarches
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-bold text-on-surface">
            <Link
              to="/niveaux"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <GraduationCap className="h-4 w-4" aria-hidden /> Niveaux
            </Link>
            <Link
              to="/sessions"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" aria-hidden /> Sessions
            </Link>
            <Link
              to="/financement"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Banknote className="h-4 w-4" aria-hidden /> Financement
            </Link>
          </div>
          <Button
            variant="primary"
            size="md"
            asChild
            className="hidden md:inline-flex font-bold active:scale-95"
          >
            <Link to="/passer-test/$token" params={{ token: "latest" }}>
              Diagnostic complet (30 min)
            </Link>
          </Button>
          <button
            type="button"
            className="md:hidden text-primary"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
      </header>

      <aside
        ref={drawerRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-outline-variant shadow-lg transform transition-transform md:hidden flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <div>
            <div className="font-headline-md text-[20px] font-bold text-primary">
              Bilan Français Formation
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
              Votre niveau, votre parcours, vos démarches
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-on-surface"
            aria-label="Fermer le menu de navigation"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 flex-1 flex flex-col gap-2">
          <Link
            to="/niveaux"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <GraduationCap className="h-5 w-5" aria-hidden /> Niveaux
          </Link>
          <Link
            to="/sessions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <Calendar className="h-5 w-5" aria-hidden /> Sessions
          </Link>
          <Link
            to="/financement"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <Banknote className="h-5 w-5" aria-hidden /> Financement
          </Link>
        </nav>
        <div className="p-4 border-t border-outline-variant space-y-2">
          <Button variant="cta" size="md" asChild className="w-full font-bold text-sm">
            <Link to="/test-rapide" onClick={() => setOpen(false)}>
              Estimer mon niveau — 3 min
            </Link>
          </Button>
          <Button variant="primary" size="md" asChild className="w-full font-bold text-sm">
            <Link
              to="/passer-test/$token"
              params={{ token: "latest" }}
              onClick={() => setOpen(false)}
            >
              Diagnostic complet (30 min)
            </Link>
          </Button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
