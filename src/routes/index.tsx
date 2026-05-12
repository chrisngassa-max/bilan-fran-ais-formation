import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/bff/Hero";
import { Card } from "@/components/bff/Card";
import { CTASection } from "@/components/bff/CTASection";
import { fundingMode, siteName, siteUrl } from "@/config/site";
import { Button } from "@/components/bff/Button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteName} — Bilan de français et formation adaptée` },
      {
        name: "description",
        content:
          "Test de niveau gratuit, orientation vers la bonne formation : TCF, carte de séjour, naturalisation, français professionnel.",
      },
      { property: "og:title", content: `${siteName} — Bilan de français` },
      {
        property: "og:description",
        content:
          "Évaluez votre niveau et trouvez la formation adaptée à votre projet en France.",
      },
      { property: "og:url", content: siteUrl + "/" },
    ],
  }),
  component: IndexPage,
});

const POUR_QUI = [
  { title: "Débutants en français", desc: "Vous arrivez en France ou vous reprenez à zéro." },
  { title: "Préparation au TCF", desc: "Vous préparez une certification officielle." },
  { title: "Salariés", desc: "Vous avez besoin du français professionnel au travail." },
  { title: "Démarches administratives", desc: "Carte de séjour, résident, naturalisation." },
];

const fundingWording =
  fundingMode === "qualiopi_direct"
    ? "Accompagnement vers les solutions de financement, dont le CPF selon votre éligibilité."
    : fundingMode === "partner_qualiopi"
      ? "Accompagnement vers les solutions de financement, avec orientation possible via un organisme partenaire certifié."
      : "Accompagnement vers les solutions de financement adaptées à votre situation (personnel, employeur, OPCO, partenaire).";

const PROPOSE = [
  { title: "Test de niveau", desc: "Une estimation rapide et claire de votre niveau actuel." },
  { title: "Orientation", desc: "Vers le parcours adapté à votre objectif." },
  { title: "Formation en petit groupe", desc: "Pour progresser à votre rythme avec un suivi humain." },
  { title: "Solutions de financement", desc: fundingWording },
];

const POURQUOI = [
  "Éviter de commencer dans un mauvais groupe",
  "Identifier vos compétences faibles",
  "Préparer un parcours réaliste",
  "Gagner du temps sur vos démarches",
];

function IndexPage() {
  return (
    <>
      <Hero />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="headline-lg text-center">Pour qui&nbsp;?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POUR_QUI.map((c) => (
              <Card key={c.title}>
                <h3 className="headline-md">{c.title}</h3>
                <p className="mt-2 body-md text-on-surface-variant">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 bg-surface-container">
        <div className="mx-auto max-w-5xl">
          <h2 className="headline-lg text-center">Ce que nous proposons</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROPOSE.map((c) => (
              <Card key={c.title}>
                <h3 className="headline-md">{c.title}</h3>
                <p className="mt-2 body-md text-on-surface-variant">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="headline-lg text-center">Pourquoi faire un bilan&nbsp;?</h2>
          <ul className="mt-8 grid gap-3">
            {POURQUOI.map((p) => (
              <li
                key={p}
                className="rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 body-lg"
              >
                <span className="mr-2 text-primary font-semibold">→</span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <Link to="/niveaux">
              <Button variant="outline">Voir les niveaux A0 à B2</Button>
            </Link>
          </div>
        </div>
      </section>

      <CTASection
        title="Commencez par un bilan simple et gratuit"
        ctaLabel="Commencer mon bilan gratuit"
        description="10 minutes pour situer votre niveau et recevoir une orientation personnalisée."
      />
    </>
  );
}
