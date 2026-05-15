import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName } from "@/config/site";
import { 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  Calendar, 
  Flag, 
  Briefcase, 
  RefreshCw, 
  HelpCircle,
  Info
} from "lucide-react";

export const Route = createFileRoute("/simulateur")({
  head: () => ({
    meta: [{ title: `${siteName} — Quel est votre objectif ?` }],
  }),
  component: SimulateurPage,
});

function SimulateurPage() {
  const options = [
    { label: "Première carte", icon: CreditCard, color: "bg-secondary-container text-on-secondary-container" },
    { label: "Carte 10 ans", icon: Calendar, color: "bg-secondary-container text-on-secondary-container" },
    { label: "Naturalisation", icon: Flag, color: "bg-secondary-container text-on-secondary-container" },
    { label: "Travail", icon: Briefcase, color: "bg-secondary-container text-on-secondary-container" },
    { label: "Renouvellement", icon: RefreshCw, color: "bg-secondary-container text-on-secondary-container" },
    { label: "Je ne sais pas", icon: HelpCircle, color: "bg-surface-variant text-on-surface-variant" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)] bg-surface">
      <main className="flex-1 py-12">
        <div className="max-w-[800px] mx-auto px-4">
          {/* Step Tracker Indicator */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4 text-xs font-bold font-label uppercase tracking-widest">
              <span className="text-secondary">Étape 1 sur 5</span>
              <span className="text-on-surface-variant">20% complété</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/5 rounded-full transition-all duration-500"></div>
            </div>
          </div>

          {/* Content Header */}
          <section className="mb-12 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-on-background mb-4">
              Quel est votre objectif ?
            </h1>
            <p className="text-lg text-on-surface-variant max-w-[600px]">
              Identifiez votre besoin pour que nous puissions vous proposer le parcours de formation le plus adapté à vos démarches administratives.
            </p>
          </section>

          {/* Grid of Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {options.map((opt, i) => (
              <Link
                key={i}
                to="/passer-test/$token"
                params={{ token: "latest" }}
                className="flex items-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl text-left transition-all group hover:border-primary hover:shadow-sm"
              >
                <div className={`${opt.color} p-3 rounded-lg mr-4 group-hover:bg-primary group-hover:text-white transition-colors`}>
                  <opt.icon className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-on-surface">{opt.label}</span>
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
            <Link to="/" className="w-full md:w-auto px-8 h-14 border-2 border-secondary text-secondary font-bold rounded-lg hover:bg-secondary-container transition-all flex items-center justify-center">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour
            </Link>
            <Link to="/passer-test/$token" params={{ token: "latest" }} className="w-full md:w-auto px-12 h-14 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center shadow-lg active:scale-95">
              Continuer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Contextual Help Card */}
          <div className="mt-12 p-6 bg-surface-container-low border border-outline-variant rounded-xl flex gap-4 items-start">
            <Info className="text-primary w-6 h-6 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-on-surface mb-1">Besoin d'aide ?</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Cette étape permet d'évaluer le niveau de langue française exigé par la préfecture selon votre situation. Chaque titre de séjour a ses propres exigences réglementaires.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
