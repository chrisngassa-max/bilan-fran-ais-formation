import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, GraduationCap, Banknote, Calculator } from "lucide-react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40">
        <nav className="max-w-[1200px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-primary h-8 w-8" />
            <div className="flex flex-col">
              <span className="font-headline-md text-[20px] font-bold text-primary leading-tight">
                Bilan Français Formation
              </span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                Votre niveau, votre parcours, vos démarches
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 font-bold text-on-surface">
            <Link
              to="/niveaux"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <GraduationCap className="h-4 w-4" /> Niveaux
            </Link>
            <Link
              to="/financement"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Banknote className="h-4 w-4" /> Financement
            </Link>
            <Link
              to="/passer-test/latest"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Calculator className="h-4 w-4" /> Diagnostic de niveau
            </Link>
          </div>
          <Link to="/passer-test/latest">
            <button className="hidden md:block bg-primary text-on-primary px-6 py-3 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all">
              Évaluer mon niveau et mes droits
            </button>
          </Link>
          <button
            className="md:hidden text-primary"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
      </header>

      {/* SideNavBar (Mobile Only Drawer) */}
      <aside
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
          <button onClick={() => setOpen(false)} className="text-on-surface">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 flex-1 flex flex-col gap-2">
          <Link
            to="/niveaux"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <GraduationCap className="h-5 w-5" /> Niveaux
          </Link>
          <Link
            to="/financement"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <Banknote className="h-5 w-5" /> Financement
          </Link>
          <Link
            to="/passer-test/latest"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg"
            activeProps={{
              className: "bg-secondary-container text-on-secondary-container font-bold",
            }}
          >
            <Calculator className="h-5 w-5" /> Diagnostic de niveau
          </Link>
        </nav>
        <div className="p-4 border-t border-outline-variant">
          <Link to="/passer-test/latest" onClick={() => setOpen(false)}>
            <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-sm">
              Évaluer mon niveau et mes droits
            </button>
          </Link>
        </div>
      </aside>
      
      {/* Overlay mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
