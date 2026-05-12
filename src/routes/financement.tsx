import { createFileRoute } from "@tanstack/react-router";
import { FundingCard } from "@/components/bff/FundingCard";
import { Disclaimer } from "@/components/bff/Disclaimer";
import { CTASection } from "@/components/bff/CTASection";
import { fundingMode, siteName, siteUrl } from "@/config/site";

export const Route = createFileRoute("/financement")({
  head: () => ({
    meta: [
      { title: `Financement de votre formation — ${siteName}` },
      {
        name: "description",
        content:
          "Solutions de financement possibles pour votre formation de français : personnel, employeur, OPCO, France Travail, partenaire.",
      },
      { property: "og:title", content: `Financement — ${siteName}` },
      {
        property: "og:description",
        content:
          "Découvrez les solutions de financement possibles pour votre formation de français.",
      },
      { property: "og:url", content: siteUrl + "/financement" },
    ],
  }),
  component: FinancementPage,
});

function FinancementPage() {
  const showCpfCard = fundingMode !== "no_qualiopi_yet";

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="headline-lg">Solutions de financement</h1>
          <p className="mt-4 body-lg text-on-surface-variant">
            Plusieurs options peuvent exister selon votre situation. Nous vous orientons
            vers celle qui correspond le mieux à votre dossier.
          </p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <FundingCard title="Financement personnel" badge="Toujours possible">
            Régler tout ou partie de la formation directement. Tarif transparent
            communiqué après étude de votre dossier.
          </FundingCard>

          <FundingCard title="Employeur">
            Si vous êtes salarié(e), votre employeur peut prendre en charge votre
            formation, notamment pour le français professionnel.
          </FundingCard>

          <FundingCard title="OPCO">
            Les opérateurs de compétences peuvent participer au financement pour
            certains salariés selon leur secteur.
          </FundingCard>

          <FundingCard title="France Travail / dispositifs publics">
            Si vous êtes demandeur d'emploi, des dispositifs publics peuvent exister
            selon votre situation et votre projet professionnel.
          </FundingCard>

          {showCpfCard && (
            <FundingCard title="CPF">
              Selon l'éligibilité de l'action et votre situation, le Compte Personnel de
              Formation peut être mobilisable.
            </FundingCard>
          )}

          <FundingCard title="Orientation vers organisme partenaire">
            Si votre dossier le permet, nous pouvons vous orienter vers un organisme
            partenaire certifié pour étudier des financements complémentaires.
          </FundingCard>
        </div>

        {fundingMode === "no_qualiopi_yet" && (
          <div className="mt-8 rounded-2xl border border-outline-variant bg-surface-container p-6 body-md text-on-surface-variant">
            Le CPF peut exister dans certains parcours éligibles via un organisme
            certifié. Pour cette première version, nous privilégions l'étude des
            solutions personnelles, employeur, OPCO ou orientation partenaire.
          </div>
        )}

        <div className="mt-8">
          <Disclaimer>
            Les possibilités de financement dépendent de votre situation. Un échange est
            nécessaire pour vérifier les options disponibles. Nous ne garantissons pas
            l'obtention d'un financement.
          </Disclaimer>
        </div>
      </div>

      <CTASection
        title="Vérifions ensemble les solutions possibles"
        ctaLabel="Vérifier les solutions possibles"
      />
    </div>
  );
}
