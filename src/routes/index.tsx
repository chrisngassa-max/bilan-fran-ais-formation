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
  Clock,
  Zap,
  Target,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { siteName } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/bff/Button";
import { Card } from "@/components/bff/Card";
import { Alert } from "@/components/ui/Alert";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteName} — Atteignez le niveau A2, B1 ou B2 exigé pour vos démarches` },
      {
        property: "og:title",
        content: `${siteName} — Atteignez le niveau A2, B1 ou B2 exigé pour vos démarches`,
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-12 px-4">
        <div className="max-w-[850px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Formation de français pour vos démarches en France
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-background mb-4 leading-tight">
            <span className="md:hidden">
              Le niveau de français exigé pour votre{" "}
              <span className="text-primary">titre de séjour, résidence ou naturalisation.</span>
            </span>
            <span className="hidden md:inline">
              Atteignez le niveau de français exigé pour votre{" "}
              <span className="text-primary">titre de séjour, votre carte de résident ou votre naturalisation.</span>
            </span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-on-surface-variant mb-8">
            Petits groupes de 6 élèves maximum. Un formateur référent à chaque étape.
          </p>
          <div className="flex justify-center">
            <Button
              variant="cta"
              asChild
              className="w-full md:w-auto h-[58px] px-8 font-bold"
            >
              <Link
                to="/test-rapide"
                onClick={() => trackEvent("landing_cta_click", { location: "hero_quick" })}
              >
                Estimer mon niveau — 3 min, gratuit
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-on-surface-variant">
            <span>Gratuit</span>
            <span>·</span>
            <span>Sans engagement</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Bilan envoyé par email</span>
          </div>
          <p className="mt-4 text-xs font-bold text-on-surface-variant">
            CPF, France Travail, OPCO, employeur : votre éligibilité est vérifiée après le test.
          </p>
        </div>

        <div className="mt-12 max-w-[1000px] mx-auto rounded-xl overflow-hidden shadow-sm border border-outline-variant">
          <div
            className="w-full h-[300px] md:h-[450px] bg-gradient-to-br from-primary-container/50 via-secondary-container/40 to-surface-container flex flex-col items-center justify-center gap-4 px-6"
            role="img"
            aria-label="Formation en petits groupes avec un formateur référent"
          >
            <GraduationCap className="h-20 w-20 text-primary opacity-80" aria-hidden />
            <p className="text-lg font-bold text-on-surface text-center max-w-md">
              Petits groupes · 6 élèves maximum · formateur référent
            </p>
          </div>
        </div>
      </section>

      {/* Bandeau alerte 2026 — remonté sous le hero */}
      <section className="px-4">
        <div className="max-w-[800px] mx-auto">
          <Alert variant="warning">
            <strong>Nouveau en 2026 :</strong> le niveau <strong>B2</strong> est désormais obligatoire pour la naturalisation française (au lieu de B1 auparavant). Source :{" "}
            <a href="https://www.service-public.fr" target="_blank" rel="noreferrer" className="underline font-semibold">service-public.fr</a>
          </Alert>
        </div>
      </section>

      {/* Tableau des niveaux */}
      <section className="py-12 px-4 bg-accent-warm">
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
                <p className="text-on-surface-variant">Le niveau requis pour la carte de résident de 10 ans.</p>
              </div>
              <Badge className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>

            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-primary text-on-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">B2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Objectif nationalité française (B2)</h3>
                <p className="text-on-surface-variant">Le niveau désormais requis pour la naturalisation française (au lieu de B1 auparavant).</p>
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
          <p className="mt-4 text-sm font-bold text-on-surface">
            Prix public à partir de 2 400 € · peut être financée selon votre situation.
          </p>
        </div>
        <div className="max-w-[800px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/financement/cpf"
            className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-colors"
          >
            <Wallet className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">CPF</span>
          </Link>
          <Link
            to="/financement"
            className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-colors"
          >
            <Building2 className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">Employeur</span>
          </Link>
          <Link
            to="/financement"
            className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-colors"
          >
            <Handshake className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">OPCO</span>
          </Link>
          <Link
            to="/financement"
            className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-colors"
          >
            <Briefcase className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">France Travail</span>
          </Link>
        </div>
      </section>

      {/* 3 Étapes (refonte automatisée) */}
      <section className="py-16 px-4 bg-secondary-container/10">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Votre parcours en 3 étapes</h2>
          <p className="text-center text-on-surface-variant max-w-xl mx-auto mb-10 text-sm">
            100 % en ligne, sans engagement. {siteName} est un organisme de formation privé — nous vous guidons, les décisions administratives restent du ressort des autorités compétentes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center space-y-3 border-outline-variant">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white bg-eval-navy">
                <Calculator className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 1</div>
              <h4 className="text-xl font-bold">Test rapide</h4>
              <p className="text-on-surface-variant text-sm">
                Quelques questions ciblées sur les 4 compétences (compréhension, expression écrite et orale).
              </p>
            </Card>
            <Card className="text-center space-y-3 border-outline-variant">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white bg-eval-navy">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 2</div>
              <h4 className="text-xl font-bold">Calcul de votre niveau</h4>
              <p className="text-on-surface-variant text-sm">
                Notre algorithme positionne votre niveau CECRL et identifie les démarches adaptées à votre projet.
              </p>
            </Card>
            <Card className="text-center space-y-3 border-outline-variant">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white bg-eval-orange">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Étape 3</div>
              <h4 className="text-xl font-bold">Réception du bilan complet</h4>
              <p className="text-on-surface-variant text-sm">
                Bilan détaillé, guide pratique et pistes de financement envoyés automatiquement par email.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Sprint 2 Blocks */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-[900px] mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à évaluer votre français ?</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Choisissez le format qui vous convient pour obtenir un bilan précis et des conseils personnalisés.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* T2 — Test rapide */}
            <div className="relative bg-surface-bright p-8 rounded-3xl border-2 border-eval-orange/40 shadow-sm hover:border-eval-orange transition-all group ring-2 ring-eval-orange/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-eval-orange-soft text-eval-orange text-xs font-bold uppercase tracking-wider rounded-full border border-eval-orange/30">
                Recommandé
              </span>
              <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> 3 minutes
              </div>
              <h3 className="text-xl font-bold mb-2">Test rapide</h3>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                10 questions ciblées. Estimation de niveau + formule adaptée à votre délai.
              </p>
              <Button variant="primary" size="md" asChild className="w-full rounded-xl text-sm shadow-md">
                <Link to="/test-rapide" onClick={() => trackEvent("home_t2_click")}>
                  Commencer <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* T3 — Test complet */}
            <div className="bg-surface-bright p-8 rounded-3xl border-2 border-secondary/20 shadow-sm hover:border-secondary transition-all group">
              <div className="bg-secondary/10 text-secondary w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> 30 minutes
              </div>
              <h3 className="text-xl font-bold mb-2">Diagnostic complet</h3>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                4 compétences évaluées : oral, écrit, grammaire, production. Programme sur-mesure.
              </p>
              <Button variant="secondary" size="md" asChild className="w-full rounded-xl text-sm shadow-md">
                <Link to="/passer-test/$token" params={{ token: "latest" }} onClick={() => trackEvent("home_t3_click")}>
                  Passer le test <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* T1 — Accompagnement admin */}
            <div className="bg-surface-bright p-8 rounded-3xl border-2 border-outline-variant shadow-sm hover:border-outline transition-all group">
              <div className="bg-surface-container text-on-surface-variant w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Sans test
              </div>
              <h3 className="text-xl font-bold mb-2">Dossier préfecture</h3>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                Besoin d'aide pour vos papiers ? Notre partenaire analyse votre dossier sous 24h.
              </p>
              <Button size="md" asChild className="w-full rounded-xl text-sm shadow-md bg-on-surface text-on-primary hover:opacity-90">
                <Link to="/accompagnement-administratif" onClick={() => trackEvent("home_t1_click")}>
                  Être contacté <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
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
