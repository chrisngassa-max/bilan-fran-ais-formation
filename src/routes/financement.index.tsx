import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName, phoneHref } from "@/config/site";
import { AlertCircle, Wallet, Building2, Users, Briefcase, Handshake, CreditCard } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/bff/Button";

export const Route = createFileRoute("/financement/")({
  head: () => ({
    meta: [
      { title: `Financer votre formation : CPF, OPCO, France Travail — ${siteName}` },
      { name: "description", content: "CPF, OPCO, employeur, France Travail : découvrez toutes les solutions de financement pour votre formation." },
      { property: "og:title", content: `Financer votre formation : CPF, OPCO, France Travail — ${siteName}` }
    ],
  }),
  component: FinancementIndexPage,
});

function FinancementIndexPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 max-w-[800px] mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
            Financer votre formation de français
          </h1>
          <p className="text-lg text-on-surface-variant">
            CPF, OPCO, employeur, France Travail : plusieurs dispositifs peuvent couvrir tout ou partie de votre formation. Vérifions ensemble votre éligibilité.
          </p>
        </header>

        {/* Warning Block */}
        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/30 mb-12 flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-8 h-8 shrink-0 mt-1" />
          <div>
            <p className="font-bold text-xl mb-2 text-error">Point de vigilance important</p>
            <p className="text-error/90 leading-relaxed">
              Nous ne garantissons pas l'obtention d'un financement : la décision finale appartient toujours au financeur (CPF, OPCO, employeur, France Travail). Notre rôle est de monter un dossier solide pour maximiser vos chances.
            </p>
          </div>
        </div>

        {/* Funding Options (Bento-inspired asymmetric layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* CPF Card - Main Focus */}
          <div className="md:col-span-2 bg-surface-bright p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3 w-full">
              <div className="w-full h-48 rounded-lg bg-gradient-to-br from-primary-container/40 via-secondary-container/30 to-surface-container flex items-center justify-center">
                <Wallet className="h-16 w-16 text-primary opacity-80" aria-hidden />
              </div>
            </div>
            <div className="md:w-2/3">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="text-primary w-8 h-8" />
                <h3 className="text-2xl font-bold text-on-surface">Compte Personnel de Formation (CPF)</h3>
              </div>
              <p className="text-on-surface-variant mb-6 leading-relaxed">
                Vos droits CPF accumulés au fil de votre carrière peuvent financer tout ou partie de votre formation de français. Vérifions le solde et l'éligibilité. Attention : nous n'utilisons pas de connexion directe simplifiée pour garantir la sécurité de votre compte.
              </p>
              <span className="inline-block bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                SÉCURISÉ & INDÉPENDANT
              </span>
            </div>
          </div>

          {/* Employeur */}
          <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-on-surface">Plan Employeur</h3>
            </div>
            <p className="text-on-surface-variant">
              Votre entreprise peut financer votre montée en compétences linguistiques dans le cadre du plan de développement des compétences.
            </p>
          </div>

          {/* OPCO */}
          <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-on-surface">OPCO</h3>
            </div>
            <p className="text-on-surface-variant">
              Pour les salariés de TPE/PME, les Opérateurs de Compétences (OPCO) peuvent prendre en charge tout ou partie des frais pédagogiques.
            </p>
          </div>

          {/* France Travail */}
          <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="text-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-on-surface">France Travail</h3>
            </div>
            <p className="text-on-surface-variant">
              Si vous êtes demandeur d'emploi, des aides spécifiques comme l'AIF peuvent être mobilisées selon votre projet professionnel.
            </p>
          </div>

          {/* Partenaire */}
          <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Handshake className="text-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-on-surface">Partenaires</h3>
            </div>
            <p className="text-on-surface-variant">
              Certaines associations ou organismes territoriaux proposent des subventions pour l'intégration par la langue française.
            </p>
          </div>

          {/* Paiement Personnel */}
          <div className="md:col-span-2 bg-secondary-container p-8 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-secondary w-8 h-8" />
              <h3 className="text-2xl font-bold text-on-surface">Paiement personnel</h3>
            </div>
            <p className="text-on-secondary-container leading-relaxed">
              Vous souhaitez financer vous-même votre formation ? Nous proposons des facilités de paiement en plusieurs fois sans frais pour étaler votre investissement.
            </p>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="text-center py-8">
          <Button variant="primary" size="lg" asChild className="h-16 px-10 text-xl font-bold shadow-md">
            <Link to="/contact" onClick={() => trackEvent("financement_cta_click", { action: "verifier_financement" })}>
              Vérifier mes financements possibles
            </Link>
          </Button>
          <p className="text-sm text-on-surface-variant mt-4">
            Réponse personnalisée sous 24 h ouvrées par nos conseillers.
          </p>
        </div>
      </main>
    </div>
  );
}
