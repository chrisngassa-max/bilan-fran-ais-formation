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
              Dans le cadre de l'utilisation de nos services (diagnostic de niveau, formulaire de réception du
              bilan, formulaire de contact), nous collectons : prénom/nom, adresse e-mail, numéro WhatsApp
              (facultatif) et réponses au test de positionnement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. Finalité du traitement</h2>
            <p>Vos données servent à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Évaluer votre niveau de français selon le référentiel CECRL.</li>
              <li>Vous envoyer automatiquement votre bilan détaillé et le guide pratique par email.</li>
              <li>Vous communiquer, dans un second temps, des informations utiles sur les pistes de financement (CPF, OPCO, employeur, France Travail) adaptées à votre profil.</li>
              <li>Répondre à vos demandes lorsque vous nous écrivez par WhatsApp ou via le formulaire de contact.</li>
            </ul>
            <p className="mt-3">
              Vous pouvez vous désabonner des relances à tout moment via le lien présent en bas de chaque email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Durée de conservation</h2>
            <p>
              Vos données personnelles sont conservées pendant une durée maximale de 3 ans à compter de notre
              dernier contact. Vos enregistrements vocaux (test) sont supprimés immédiatement après analyse
              algorithmique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">4. Vos droits (RGPD)</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression,
              d'opposition et de portabilité de vos données. Pour exercer ces droits, contactez-nous via la
              page de contact ou par e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">5. Absence de garantie de financement</h2>
            <p>
              Aucune garantie de prise en charge financière ne peut être donnée avant l'étude individuelle de
              votre dossier auprès des organismes financeurs compétents (CPF, OPCO, France Travail, employeur).
              Les informations fournies sont indicatives.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
