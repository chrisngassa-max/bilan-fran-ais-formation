import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName, phoneHref } from "@/config/site";
import { AlertCircle, Wallet, Building2, Users, Briefcase, Handshake, CreditCard } from "lucide-react";

export const Route = createFileRoute("/financement")({
  head: () => ({
    meta: [{ title: `${siteName} — Financer votre formation` }],
  }),
  component: FinancementPage,
});

function FinancementPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 max-w-[800px] mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
            Financer votre formation
          </h1>
          <p className="text-lg text-on-surface-variant">
            De nombreuses solutions existent pour accompagner votre projet d'apprentissage du français. Découvrez les dispositifs adaptés à votre situation professionnelle et personnelle.
          </p>
        </header>

        {/* Warning Block */}
        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/30 mb-12 flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-8 h-8 shrink-0 mt-1" />
          <div>
            <p className="font-bold text-xl mb-2 text-error">Point de vigilance important</p>
            <p className="text-error/90 leading-relaxed">
              Nous ne garantissons pas l'obtention d'un financement. Chaque situation est unique et doit être vérifiée auprès des organismes compétents avant toute inscription définitive.
            </p>
          </div>
        </div>

        {/* Funding Options (Bento-inspired asymmetric layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* CPF Card - Main Focus */}
          <div className="md:col-span-2 bg-surface-bright p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3">
              <img 
                className="w-full h-48 object-cover rounded-lg" 
                alt="Espace de travail" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB8bQ4XytVH184pz3nNSnEdS-bgFIzRDSJQYAhXoiFpUNUZVvj7Ed6maJDBR2lI2QNw0zOGrCY968aPwph0vZBLIGvQVtYXR4bHgh0wEfA2bOmHYwaqGYgf0pz6n1JcB1miOWqcusRNnB8zXyTR9aSzTN9jUEWaR7WBplHjKzO7YANbJB4BwsI7VmlcBMjkVCOsTHhlFBTJiGQvMPQOOHBOJByj7-WHwocYIX3_VDRYQ9bIO2A6XZMxwsV4WsZgg7t0xflB4ZLZl4" 
              />
            </div>
            <div className="md:w-2/3">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="text-primary w-8 h-8" />
                <h3 className="text-2xl font-bold text-on-surface">Compte Personnel de Formation (CPF)</h3>
              </div>
              <p className="text-on-surface-variant mb-6 leading-relaxed">
                Utilisez vos droits acquis tout au long de votre carrière. Attention : nous n'utilisons pas de connexion directe simplifiée pour garantir la sécurité de votre compte.
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
          <Link to="/contact">
            <button className="bg-primary text-on-primary px-10 h-16 rounded-xl font-bold text-xl hover:opacity-90 active:scale-95 transition-all shadow-md">
              Vérifier les solutions possibles
            </button>
          </Link>
          <p className="text-sm text-on-surface-variant mt-4">
            Réponse personnalisée sous 48h par nos conseillers.
          </p>
        </div>
      </main>
    </div>
  );
}
