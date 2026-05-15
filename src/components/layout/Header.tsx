import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/bff/Button";
import { siteName } from "@/config/site";

const NAV = [
  { to: "/niveaux", label: "Niveaux" },
  { to: "/financement", label: "Financement" },
  { to: "/passer-test/$token", params: { token: "latest" }, label: "Évaluation" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-bright/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="font-semibold text-on-surface text-lg">
          {siteName}
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="body-md text-on-surface-variant hover:text-primary transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {n.label}
            </Link>
          ))}
          <Link to="/passer-test/$token" params={{ token: "latest" }}>
            <Button size="md" variant="primary">
              Faire le test complet
            </Button>
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden p-2 text-on-surface"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-outline-variant bg-surface-bright md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Navigation mobile">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 body-lg text-on-surface hover:bg-surface-container"
                activeProps={{ className: "bg-surface-container text-primary font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
            <Link to="/passer-test/$token" params={{ token: "latest" }} onClick={() => setOpen(false)} className="mt-2">
              <Button size="md" variant="primary" className="w-full">
                Faire le test complet
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
