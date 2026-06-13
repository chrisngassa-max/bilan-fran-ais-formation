import { BadgeEuro, LineChart, ShieldCheck, LogIn, ArrowRight, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/bff/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion Espace Conseiller — Bilan Français Formation" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Login,
});

export function Login() {
  const { signIn, user, loading, configError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If user is already logged in, redirect to admin
  if (user) {
    navigate({ to: "/admin" });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    } else {
      navigate({ to: "/admin" });
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[85vh] flex flex-col lg:flex-row bg-surface">
      {/* Left side: Branding */}
      <section className="flex-1 bg-gradient-to-br from-on-surface-variant to-sidebar-bg text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[300px] lg:min-h-0">
        {/* Decorative background element */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl opacity-50" aria-hidden="true" />
        
        <div className="relative z-10 my-auto lg:my-0 space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-bold text-white shadow-lg text-lg">
            BFF
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-container mb-2">Bilan Français Formation</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            Espace de gestion administrative & pédagogique.
          </h1>
          <p className="text-lg text-outline-variant max-w-xl">
            Priorisez les dossiers d'apprentissage, qualifiez les dossiers préfectoraux et gérez les transmissions vers les experts agréés en toute conformité.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 mt-12 lg:mt-0 text-sm font-medium text-white/90">
          <span className="flex items-center gap-2"><ShieldCheck size={20} className="text-primary-container" /> Dossiers conformes</span>
          <span className="flex items-center gap-2"><LineChart size={20} className="text-primary-container" /> Taux d'admission</span>
          <span className="flex items-center gap-2"><BadgeEuro size={20} className="text-primary-container" /> CPF & Financements</span>
        </div>
      </section>

      {/* Right side: Login Form */}
      <section className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-surface-container-lowest">
        <div className="w-full max-w-md flex flex-col gap-8 rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-outline-variant/30 relative">
          
          <header className="flex flex-col gap-2 text-center items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <LogIn size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Accès sécurisé</p>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              Connexion Conseiller
            </h2>
          </header>

          {configError && (
            <Alert variant="error">{configError}</Alert>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Adresse email</span>
              <Input
                type="email"
                required
                className="h-11 rounded-lg border border-outline-variant bg-surface text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom.prenom@exemple.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Mot de passe</span>
              <Input
                type="password"
                required
                className="h-11 rounded-lg border border-outline-variant bg-surface text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            
            {error && <Alert variant="error">{error}</Alert>}
            
            <Button
              type="submit"
              disabled={busy || Boolean(configError)}
              className="mt-2 h-11 w-full"
            >
              {busy ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant inline-flex items-center gap-1.5">
              <Lock size={12} className="shrink-0" />
              Vos données d'administration sont strictement confidentielles.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
