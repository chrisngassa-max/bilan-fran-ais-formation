import { createFileRoute } from "@tanstack/react-router";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [{ title: `${siteName} — Politique de Confidentialité` }],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-[800px] mx-auto bg-surface-bright p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant">
        <h1 className="text-3xl font-bold mb-8 text-on-surface">Politique de Confidentialité</h1>
        
        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Collecte des données</h2>
            <p>
              Dans le cadre de l'utilisation de nos services (simulateur d'évaluation de niveau, formulaire de contact), 
              nous collectons les données suivantes : nom, prénom, adresse e-mail, numéro de téléphone, et réponses 
              au test de positionnement linguistique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. Finalité du traitement</h2>
            <p>
              Ces données sont strictement utilisées pour :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>L'évaluation de votre niveau de français.</li>
              <li>La proposition d'un parcours de formation adapté.</li>
              <li>La prise de contact par nos conseillers (uniquement si vous en faites la demande).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Durée de conservation</h2>
            <p>
              Vos données personnelles sont conservées pendant une durée maximale de 3 ans à compter 
              de notre dernier contact. Vos enregistrements vocaux (test) sont supprimés immédiatement après analyse algorithmique.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">4. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit 
              d'accès, de rectification, de suppression et d'opposition au traitement de vos données. 
              Pour exercer ces droits, vous pouvez nous contacter via notre page de contact ou par e-mail.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
