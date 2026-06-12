import { createFileRoute } from "@tanstack/react-router";
import { siteName, contactInfo } from "@/config/site";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: `Politique de confidentialité — ${siteName}` },
      { property: "og:title", content: `Politique de confidentialité — ${siteName}` },
    ],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 md:px-8">
      <div className="max-w-[850px] mx-auto bg-surface-bright p-8 md:p-12 rounded-2xl shadow-lg border border-outline-variant">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-on-surface tracking-tight">Politique de Confidentialité</h1>
        
        <p className="text-sm text-on-surface-variant italic mb-8">
          Dernière mise à jour : 17 mai 2026. Cette politique décrit la manière dont nous collectons, utilisons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
        </p>

        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              1. Identité du responsable de traitement
            </h2>
            <p>
              Les traitements de données personnelles décrits ci-dessous sont réalisés par la société exploitant la plateforme <strong>{siteName}</strong>, dont le siège social est situé en France, représentée par son représentant légal.
            </p>
            <p>
              Pour toute question ou réclamation concernant vos données personnelles, vous pouvez contacter notre Délégué à la protection des données ([À COMPLÉTER : nom ou « le représentant légal »]) à l'adresse e-mail dédiée : <a href="mailto:dpo@bilanfrancaisformation.fr" className="text-primary underline font-medium">dpo@bilanfrancaisformation.fr</a> ou à l'adresse postale indiquée dans nos mentions légales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              2. Données personnelles collectées
            </h2>
            <p>
              Dans le cadre de l'utilisation de la plateforme et de notre outil de diagnostic linguistique, nous collectons les données suivantes :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Identité :</strong> Prénom, nom et, lorsque vous les renseignez pour une préqualification financement, date de naissance et nationalité.</li>
              <li><strong>Coordonnées :</strong> Adresse e-mail (obligatoire pour l'envoi), numéro WhatsApp (optionnel).</li>
              <li><strong>Adresse déclarée :</strong> Adresse postale, code postal et ville lorsque vous choisissez de les transmettre dans le profil financement.</li>
              <li><strong>Données de positionnement linguistique :</strong> Réponses au test, temps de réponse, niveau estimé (A1, A2, B1, B2). Ces données constituent un positionnement interne indicatif et n'ont pas de valeur officielle préfectorale.</li>
              <li><strong>Démarche administrative :</strong> Type de démarche déclarée (Titre de séjour, Carte de résident, Naturalisation, autre).</li>
              <li><strong>Preuves de consentement :</strong> Case cochée, adresse IP (anonymisée), version des textes de consentement présentés et horodatage précis (timestamp).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              3. Finalités du traitement
            </h2>
            <p>Vos données personnelles font l'objet d'un traitement pour les finalités explicites suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Envoi de votre bilan :</strong> Génération et envoi automatique de votre bilan de positionnement et du guide pratique par e-mail ou WhatsApp.</li>
              <li><strong>Proposition de formations adaptées :</strong> Recommandation de parcours linguistiques et d'accompagnement de préparation aux examens (TCF, DELF) et vérification de votre éligibilité à des financements publics ou paritaires (CPF, France Travail, OPCO).</li>
              <li><strong>Étude de financement :</strong> Transmission des informations nécessaires à un partenaire chargé d'étudier les pistes de financement de votre formation, <strong>uniquement si vous y avez consenti via la case dédiée au financement</strong>.</li>
              <li><strong>Mise en relation avec un partenaire tiers :</strong> Transmission sécurisée de vos coordonnées et de votre niveau estimé à un cabinet expert en démarches administratives et montage de dossiers de séjour/nationalité, <strong>uniquement si vous y avez consenti de manière expresse et distincte</strong>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              4. Base légale des traitements
            </h2>
            <p>
              La base légale du traitement de vos données personnelles est votre <strong>consentement explicite et éclairé</strong> (Article 6.1.a du RGPD), matérialisé par des cases à cocher distinctes lors de la soumission de vos formulaires. Vous êtes libre de consentir uniquement à la réception de votre bilan sans consentir à une transmission vers un partenaire financement ou vers un partenaire d'accompagnement administratif.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              5. Transmission à des tiers
            </h2>
            <p>
              Lorsque vous demandez l'étude d'un financement de formation et donnez l'opt-in correspondant, les informations utiles à cette étude peuvent être transmises à notre <strong>partenaire financement</strong>. Cette transmission concerne le financement de la formation et ne vaut pas demande d'accompagnement administratif.
            </p>
            <p>
              Vos données de contact et de niveau linguistique peuvent être transmises à notre <strong>partenaire spécialisé en accompagnement administratif</strong> (cabinet conseil externe sélectionné) dans le seul but de vous aider dans la constitution de votre dossier préfectoral.
            </p>
            <p className="bg-surface-container p-4 rounded-xl border border-outline-variant italic">
              <strong>⚠️ Règle absolue de consentement :</strong> Aucune donnée n'est transmise à un partenaire sans votre consentement explicite, libre et séparé, recueilli via la case d'opt-in correspondant à votre demande.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              6. Durée de conservation des données
            </h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Leads actifs :</strong> Vos données sont conservées pendant une durée maximale de <strong>3 ans</strong> à compter de notre dernier contact (ex. clic dans un email, échange direct).</li>
              <li><strong>Leads archivés :</strong> En cas d'inactivité prolongée au-delà de 3 ans, les données sont archivées de manière sécurisée pendant <strong>5 ans</strong> avant suppression définitive, à des fins de gestion des contentieux.</li>
              <li><strong>Preuves de consentement :</strong> Les logs de consentement (horodatage, version du texte de consentement coché) sont conservés pendant <strong>5 ans</strong> pour répondre à nos obligations légales de traçabilité et d'audit.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              7. Vos droits et exercice de vos droits
            </h2>
            <p>
              Conformément à la réglementation européenne, vous disposez d'un droit d'accès, de rectification, d'effacement (droit à l'oubli), de limitation de traitement, d'opposition et de portabilité de vos données personnelles. Vous pouvez également retirer votre consentement à tout moment.
            </p>
            <p>
              Pour exercer vos droits, vous pouvez contacter notre Délégué à la protection des données ([À COMPLÉTER : nom ou « le représentant légal »]) par e-mail à : <a href="mailto:dpo@bilanfrancaisformation.fr" className="text-primary underline font-medium">dpo@bilanfrancaisformation.fr</a>. Nous nous engageons à vous apporter une réponse motivée sous un délai maximum de <strong>30 jours</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              8. Mesure d'audience et cookies
            </h2>
            <p>
              Nous utilisons des outils de mesure d'audience anonymes et respectueux de la vie privée (Plausible Analytics) qui ne collectent aucune donnée personnelle et ne nécessitent pas le dépôt de cookies publicitaires traceurs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
