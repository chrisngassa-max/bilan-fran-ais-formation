import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  Badge,
  Flag,
  Wallet,
  Building2,
  Handshake,
  Briefcase,
  Gavel,
  Sparkles,
  Calculator,
  Mail,
  ShieldCheck,
  Lock,
  Clock,
} from "lucide-react";
import { siteName } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-12 px-4">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            100% automatisé · Sans appel obligatoire
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-on-background mb-4 leading-tight">
            Votre bilan de niveau, votre guide pratique et vos pistes de financement — par email.
          </h1>
          <p className="text-lg text-on-surface-variant mb-8">
            Un diagnostic rigoureux inspiré du référentiel CECRL pour vos démarches de carte de séjour, carte
            de résident ou naturalisation. Reçu automatiquement, en quelques minutes.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/passer-test/$token"
              params={{ token: "latest" }}
              onClick={() => trackEvent("landing_cta_click", { location: "hero" })}
            >
              <button
                className="h-[58px] w-full md:w-auto px-8 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md text-white"
                style={{ backgroundColor: "#f97316" }}
              >
                Démarrer mon diagnostic gratuit
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/niveaux">
              <button
                className="h-[58px] w-full md:w-auto border-2 px-8 rounded-lg font-bold flex items-center justify-center hover:bg-primary/5 active:scale-95 transition-all"
                style={{ borderColor: "#1e3a8a", color: "#1e3a8a" }}
              >
                Comprendre les niveaux A2, B1, B2
              </button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> ≈ 5 min</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Données protégées</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Bilan envoyé par email</span>
          </div>
        </div>

        <div className="mt-12 max-w-[1000px] mx-auto rounded-xl overflow-hidden shadow-sm border border-outline-variant">
          <img
            alt="Apprenants travaillant leur français"
            className="w-full h-[300px] md:h-[450px] object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzYQMSLme1QuqbxfGCtlkQdEwrsTAawK3v1CJ4VpHQNRvuwta1hEDoFjoM-BZPTfFIZNzcmX_aMyA3Own7y38Ms33q4fs7KaMl28oax7RGNn2V11qZu6VdNiyVzHNUHXlO8RFh13pxqAn8aTop1XWq5XcpETWVmHoqRbtzbHSlrt4gNrgi8nb3YiWwMffyu3byArf13QUcVl5WU-UrHnvZpYtVyYiKj9Bl0_EDkHGXkejkyIBfhtFN4e3owE2jSVwHbL9rKsBM39c"
          />
        </div>
      </section>

      {/* Tableau des niveaux */}
      <section className="py-12 px-4 bg-[#f8efec]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Le niveau de français demandé pour chaque démarche
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-primary-container/20 text-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">A2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Objectif séjour (A2)</h3>
                <p className="text-on-surface-variant">Les bases utiles pour comprendre, répondre et gérer les échanges simples du quotidien en France.</p>
              </div>
              <FileText className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>

            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-secondary-container text-secondary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">B1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Objectif résidence (B1)</h3>
                <p className="text-on-surface-variant">Un niveau d'autonomie qui vous aide à viser la carte de résident et à gagner en aisance dans votre vie en France.</p>
              </div>
              <Badge className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>

            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-primary text-on-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">B2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Objectif citoyenneté (B2)</h3>
                <p className="text-on-surface-variant">Le niveau attendu pour une demande de naturalisation avec une expression plus fluide, plus nuancée et plus sûre.</p>
              </div>
              <Flag className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Financements */}
      <section className="py-12 px-4">
        <div className="max-w-[800px] mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Optimisez vos droits</h2>
          <p className="text-on-surface-variant mt-4">
            Selon votre situation, votre parcours peut être financé en tout ou partie. Le bilan que vous recevez
            par email identifie les pistes adaptées à votre profil.
          </p>
        </div>
        <div className="max-w-[800px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Wallet className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">CPF</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Building2 className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">Employeur</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Handshake className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">OPCO</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Briefcase className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">France Travail</span>
          </div>
        </div>
      </section>

      {/* 3 Étapes (refonte automatisée) */}
      <section className="py-16 px-4 bg-secondary-container/10">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Votre parcours en 3 étapes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant text-center space-y-3">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                <Calculator className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 1</div>
              <h4 className="text-xl font-bold">Test rapide</h4>
              <p className="text-on-surface-variant text-sm">
                Quelques questions ciblées sur les 4 compétences (compréhension, expression écrite et orale).
              </p>
            </div>
            <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant text-center space-y-3">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 2</div>
              <h4 className="text-xl font-bold">Calcul de votre niveau</h4>
              <p className="text-on-surface-variant text-sm">
                Notre algorithme positionne votre niveau CECRL et identifie les démarches adaptées à votre projet.
              </p>
            </div>
            <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant text-center space-y-3">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#f97316" }}
              >
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 3</div>
              <h4 className="text-xl font-bold">Réception du bilan complet</h4>
              <p className="text-on-surface-variant text-sm">
                Bilan détaillé, guide pratique et pistes de financement envoyés automatiquement par email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc Réassurance - 100% autonome */}
      <section className="py-16 px-4">
        <div className="max-w-[900px] mx-auto bg-surface-bright rounded-3xl border border-outline-variant shadow-sm p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Un service pensé pour votre autonomie</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Vous avancez à votre rythme, sans rendez-vous imposé. Notre tunnel est 100% autonome — vous
              gardez la main de bout en bout.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div
                className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1e3a8a20", color: "#1e3a8a" }}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold">Sans engagement</h4>
              <p className="text-sm text-on-surface-variant">
                Gratuit, sans inscription longue, sans obligation de suite.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div
                className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1e3a8a20", color: "#1e3a8a" }}
              >
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-bold">Sans appel obligatoire</h4>
              <p className="text-sm text-on-surface-variant">
                Aucun conseiller ne vous appelle. Vous décidez si et quand vous voulez échanger.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div
                className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1e3a8a20", color: "#1e3a8a" }}
              >
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold">Tout par email</h4>
              <p className="text-sm text-on-surface-variant">
                Bilan, guide pratique et pistes de financement directement dans votre boîte mail.
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/passer-test/$token"
              params={{ token: "latest" }}
              onClick={() => trackEvent("landing_cta_click", { location: "reassurance" })}
            >
              <button
                className="h-[56px] px-8 rounded-lg font-bold text-white inline-flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md"
                style={{ backgroundColor: "#f97316" }}
              >
                Lancer mon diagnostic
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bloc Juridique */}
      <section className="pb-12 px-4">
        <div className="max-w-[800px] mx-auto p-6 bg-error-container/20 border-l-4 border-error rounded-r-lg">
          <div className="flex gap-4">
            <Gavel className="text-error w-8 h-8 shrink-0" />
            <div>
              <h5 className="font-bold text-error mb-1">Information Importante</h5>
              <p className="text-sm text-on-surface-variant">
                {siteName} est un organisme de formation privé. Nous ne sommes pas un service de l'État ou de
                la Préfecture. Les décisions finales concernant l'obtention de votre titre de séjour ou de
                votre nationalité dépendent exclusivement des autorités compétentes. Aucune garantie de
                financement ne peut être donnée avant étude individuelle de votre dossier.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
