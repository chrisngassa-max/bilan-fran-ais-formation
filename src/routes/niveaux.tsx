import { createFileRoute } from "@tanstack/react-router";
import { LevelCard } from "@/components/bff/LevelCard";
import { Disclaimer } from "@/components/bff/Disclaimer";
import { CTASection } from "@/components/bff/CTASection";
import { siteName, siteUrl } from "@/config/site";

export const Route = createFileRoute("/niveaux")({
  head: () => ({
    meta: [
      { title: `Niveaux A0 à B2 — ${siteName}` },
      {
        name: "description",
        content:
          "Comprendre les niveaux de français A0, A1, A2, B1, B2 selon le CECRL et leur correspondance avec les démarches administratives.",
      },
      { property: "og:title", content: `Niveaux de français A0 à B2 — ${siteName}` },
      {
        property: "og:description",
        content:
          "Description des niveaux CECRL et de leur lien avec la carte de séjour, la carte de résident et la naturalisation.",
      },
      { property: "og:url", content: siteUrl + "/niveaux" },
    ],
  }),
  component: NiveauxPage,
});

function NiveauxPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="headline-lg">Les niveaux de français</h1>
          <p className="mt-4 body-lg text-on-surface-variant">
            Du débutant complet (A0) au niveau autonome avancé (B2). Trouvez où vous
            vous situez.
          </p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <LevelCard
            level="A0"
            understands="Quelques mots isolés"
            speaks="Se présenter avec des mots simples"
            writes="Son nom, des chiffres"
            difficulties="Compréhension globale, prononciation"
            training="Alphabétisation ou français débutant complet"
          />
          <LevelCard
            level="A1"
            understands="Phrases courtes du quotidien"
            speaks="Se présenter, demander un renseignement basique"
            writes="Phrases simples, formulaires basiques"
            difficulties="Conjugaisons, vocabulaire limité"
            training="Français débutant"
          />
          <LevelCard
            level="A2"
            understands="Conversations simples sur des sujets familiers"
            speaks="Échanger sur la vie quotidienne, le travail"
            writes="Messages courts, mails simples"
            difficulties="Temps du passé, structures complexes"
            training="Consolidation A2 / préparation TCF A2"
            admin="Peut être demandé pour une première carte de séjour pluriannuelle."
          />
          <LevelCard
            level="B1"
            understands="L'essentiel d'une discussion claire"
            speaks="Raconter, expliquer, donner un avis simple"
            writes="Lettres, courriers personnels, textes structurés"
            difficulties="Subjonctif, vocabulaire administratif"
            training="Préparation TCF B1 / français intermédiaire"
            admin="Peut être demandé pour la carte de résident 10 ans."
          />
          <LevelCard
            level="B2"
            understands="Discussions complexes, débats, médias"
            speaks="Argumenter, nuancer, défendre un point de vue"
            writes="Rédactions structurées, courriers formels"
            difficulties="Registres soutenus, expressions idiomatiques"
            training="Préparation TCF B2 / français avancé"
            admin="Peut être demandé pour la naturalisation."
          />
        </div>

        <div className="mt-10">
          <Disclaimer>
            Ce test donne une estimation. Il ne remplace pas une certification officielle
            (TCF, TEF, DELF/DALF). Le niveau exact exigé pour votre démarche doit être
            vérifié au cas par cas.
          </Disclaimer>
        </div>
      </div>

      <CTASection
        title="Pas sûr(e) de votre niveau&nbsp;?"
        ctaLabel="Faire mon estimation gratuite"
      />
    </div>
  );
}
