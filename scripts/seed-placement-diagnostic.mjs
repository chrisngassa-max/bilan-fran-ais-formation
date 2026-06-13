/**
 * Generates SQL to seed placement_tests + placement_test_items from bff_placement_content_v1
 * Run: node scripts/seed-placement-diagnostic.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const diagnostic = {
  placement_test: {
    title: "Diagnostic complet de français — Bilan Français Formation",
    target_exam: "TCF_IRN",
    target_public: "adultes_allophones_france",
    status: "published",
    niveaux_couverts: ["A1", "A2", "B1", "B2"],
    competences: ["CE", "CO", "EE", "EO"],
    contexte: "Préfecture, CAF, mairie, santé, logement, travail, naturalisation",
  },
  items: [
    { skill: "CE", level_cecrl: "A1", difficulty: 1, context: "sante", support_type: "sms", support: "Bonjour, votre rendez-vous avec le Dr Martin est confirmé pour le mardi 12 mai à 14h00. N'oubliez pas votre carte Vitale.", prompt: "Lisez ce SMS et répondez à la question.", question: "Que devez-vous apporter à ce rendez-vous ?", options: [{ id: "A", text: "Un carnet de santé." }, { id: "B", text: "Une carte Vitale." }, { id: "C", text: "De l'argent liquide." }], correct_answer: "B", explanation: "Le message précise explicitement « N'oubliez pas votre carte Vitale ».", distractors_analysis: "Les options A et C sont des éléments courants chez le médecin, mais seul l'élément B est mentionné dans le texte.", audio_script: null, score: 1, order_index: 0, tags: ["sante", "rdv", "A1"], is_validated: true },
    { skill: "CE", level_cecrl: "A1", difficulty: 1, context: "mairie", support_type: "affiche", support: "Mairie de quartier - Service État Civil.\nHoraires d'ouverture : \nLundi au Jeudi : 9h00 - 16h00\nVendredi : 9h00 - 12h00\nFermé le week-end.", prompt: "Lisez cette affiche et répondez à la question.", question: "À quelle heure ferme la mairie le vendredi ?", options: [{ id: "A", text: "À 16h00." }, { id: "B", text: "Elle est fermée toute la journée." }, { id: "C", text: "À 12h00." }], correct_answer: "C", explanation: "L'affiche indique « Vendredi : 9h00 - 12h00 », la mairie ferme donc à 12h00.", distractors_analysis: "16h00 correspond aux autres jours de la semaine. Fermée toute la journée correspond au week-end.", audio_script: null, score: 1, order_index: 1, tags: ["mairie", "horaires", "A1"], is_validated: true },
    { skill: "CE", level_cecrl: "A2", difficulty: 2, context: "logement", support_type: "email", support: "Chers locataires,\nEn raison de travaux sur le réseau municipal, l'eau sera coupée dans tout l'immeuble le mercredi 15 novembre, de 10h à 14h. Merci de prendre vos précautions.\nLe Syndic", prompt: "Lisez cet e-mail et répondez à la question.", question: "Pourquoi l'eau sera-t-elle coupée ?", options: [{ id: "A", text: "Parce qu'il y a des travaux." }, { id: "B", text: "Parce que la facture n'est pas payée." }, { id: "C", text: "Parce qu'il y a une inondation." }], correct_answer: "A", explanation: "Le texte indique clairement « En raison de travaux sur le réseau municipal ».", distractors_analysis: "Les options B et C sont des raisons possibles de coupure d'eau dans la vraie vie, mais ne sont pas celles énoncées par le syndic.", audio_script: null, score: 1, order_index: 2, tags: ["logement", "travaux", "A2"], is_validated: true },
    { skill: "CE", level_cecrl: "A2", difficulty: 2, context: "ecole", support_type: "mot_carnet", support: "Madame, Monsieur,\nVotre enfant Léo a oublié son livre de mathématiques aujourd'hui. C'est la troisième fois cette semaine. Pouvons-nous nous rencontrer mardi prochain à 17h pour en discuter ?\nLa maîtresse", prompt: "Lisez ce mot dans le carnet de liaison et répondez à la question.", question: "Que demande la maîtresse aux parents ?", options: [{ id: "A", text: "D'acheter un nouveau livre." }, { id: "B", text: "De punir leur enfant Léo." }, { id: "C", text: "De venir la rencontrer mardi." }], correct_answer: "C", explanation: "La maîtresse demande un rendez-vous avec la question « Pouvons-nous nous rencontrer mardi prochain à 17h ? ».", distractors_analysis: "Le livre est le sujet du problème mais elle ne demande pas d'en acheter un. La punition n'est pas évoquée.", audio_script: null, score: 1, order_index: 3, tags: ["ecole", "rendez-vous", "A2"], is_validated: true },
    { skill: "CE", level_cecrl: "B1", difficulty: 3, context: "caf", support_type: "courrier", support: "Objet : Déclaration de ressources incomplète.\nSuite à l'étude de votre dossier, nous constatons qu'il manque vos fiches de paie de novembre et décembre. Vos droits à l'Aide Personnalisée au Logement (APL) sont suspendus jusqu'à réception de ces documents.", prompt: "Lisez ce courrier administratif et répondez à la question.", question: "Quelle est la conséquence du dossier incomplet ?", options: [{ id: "A", text: "L'aide au logement n'est plus versée pour le moment." }, { id: "B", text: "Le locataire doit quitter son appartement." }, { id: "C", text: "L'aide au logement va augmenter." }], correct_answer: "A", explanation: "« Droits suspendus » signifie que le versement de l'aide s'arrête provisoirement.", distractors_analysis: "Quitter l'appartement (B) est une déduction extrême erronée. Augmenter l'aide (C) est le contraire du mot 'suspendus'.", audio_script: null, score: 2, order_index: 4, tags: ["caf", "apl", "administratif", "B1"], is_validated: true },
    { skill: "CE", level_cecrl: "B1", difficulty: 3, context: "travail", support_type: "email", support: "Bonjour,\nVotre profil correspond à notre recherche pour le poste de préparateur de commandes. Je vous invite à un entretien d'embauche dans nos locaux situés zone industrielle Sud, le 14 septembre à 10h. Merci de confirmer votre présence par retour de mail.", prompt: "Lisez ce message et répondez à la question.", question: "Que doit faire la personne qui reçoit ce message ?", options: [{ id: "A", text: "Envoyer un e-mail pour dire si elle sera présente." }, { id: "B", text: "Commencer à travailler le 14 septembre." }, { id: "C", text: "Téléphoner pour obtenir l'adresse." }], correct_answer: "A", explanation: "La phrase « Merci de confirmer votre présence par retour de mail » invite le candidat à répondre par écrit pour valider sa venue.", distractors_analysis: "L'option B confond l'entretien d'embauche avec une prise de poste. L'option C suggère d'appeler, alors que le texte demande un mail et donne déjà l'adresse.", audio_script: null, score: 2, order_index: 5, tags: ["travail", "entretien", "B1"], is_validated: true },
    { skill: "CE", level_cecrl: "B2", difficulty: 4, context: "mairie", support_type: "article_bulletin", support: "La municipalité lance son nouveau plan de mobilité douce. Dès le 1er janvier, la circulation automobile sera strictement interdite dans l'hypercentre, à l'exception des véhicules de livraison (de 6h à 9h) et des résidents munis d'un macaron spécifique. Des navettes électriques gratuites assureront la liaison avec les parkings relais périphériques.", prompt: "Lisez cet extrait du bulletin municipal et répondez à la question.", question: "Qui a le droit de conduire dans le centre-ville à 14h ?", options: [{ id: "A", text: "Les livreurs et les navettes gratuites." }, { id: "B", text: "Les personnes qui habitent le quartier et qui ont une autorisation." }, { id: "C", text: "Tous ceux qui ont garé leur voiture au parking relais." }], correct_answer: "B", explanation: "À 14h, les livreurs ne peuvent plus circuler (limités à 6h-9h). Seuls les résidents munis d'un macaron (autorisation) et les navettes peuvent circuler.", distractors_analysis: "Les livreurs (A) ont une limite horaire (6h-9h). L'option C est fausse car garer sa voiture en périphérie implique justement de ne pas circuler au centre.", audio_script: null, score: 3, order_index: 6, tags: ["mairie", "transport", "B2"], is_validated: true },
    { skill: "CE", level_cecrl: "B2", difficulty: 4, context: "impots", support_type: "courrier", support: "Objet : Demande de renseignements complémentaires.\nAprès examen de votre déclaration de revenus de l'année écoulée, l'administration fiscale a relevé une discordance concernant vos frais réels déclarés. Conformément à l'article L. 10 du Livre des Procédures Fiscales, nous vous prions de bien vouloir nous faire parvenir l'ensemble des justificatifs kilométriques dans un délai de 30 jours, sous peine de redressement.", prompt: "Lisez ce document officiel et répondez à la question.", question: "Que risque l'usager s'il ne répond pas à temps ?", options: [{ id: "A", text: "L'usager risque de devoir payer une amende ou plus d'impôts." }, { id: "B", text: "L'usager sera convoqué au tribunal administratif." }, { id: "C", text: "L'usager devra refaire sa déclaration pour l'année prochaine." }], correct_answer: "A", explanation: "« Sous peine de redressement » signifie que l'administration recalculera les impôts à la hausse si les preuves (justificatifs) ne sont pas fournies.", distractors_analysis: "Le texte ne mentionne ni tribunal (B) ni la déclaration de l'année suivante (C).", audio_script: null, score: 3, order_index: 7, tags: ["impots", "fiscal", "B2"], is_validated: true },
    { skill: "CO", level_cecrl: "A1", difficulty: 1, context: "commerce", support_type: "annonce_sonore", support: "Haut-parleur dans un magasin.", prompt: "Écoutez l'annonce et répondez à la question.", question: "Où devez-vous aller ?", options: [{ id: "A", text: "Vers la sortie principale." }, { id: "B", text: "Vers les caisses pour payer." }, { id: "C", text: "Vers le rayon des fruits." }], correct_answer: "B", explanation: "L'annonce demande aux clients de se diriger vers les caisses avant la fermeture.", distractors_analysis: "L'annonce ne parle ni de sortie directe sans payer, ni de rayon spécifique.", audio_script: "Chers clients, votre supermarché fermera ses portes dans quinze minutes. Merci de vous diriger vers les caisses avec vos achats. Bonne soirée.", score: 1, order_index: 8, tags: ["commerce", "annonce", "A1"], is_validated: true },
    { skill: "CO", level_cecrl: "A1", difficulty: 1, context: "vie_quotidienne", support_type: "message_vocal", support: "Téléphone portable.", prompt: "Écoutez ce message vocal et répondez à la question.", question: "Quel est le lieu de rendez-vous ?", options: [{ id: "A", text: "À la gare." }, { id: "B", text: "Devant le cinéma." }, { id: "C", text: "Au restaurant." }], correct_answer: "B", explanation: "Le message mentionne clairement « devant le cinéma ».", distractors_analysis: "Aucun autre lieu n'est évoqué par la personne qui parle.", audio_script: "Salut, c'est Sarah ! Je suis en retard. On se voit à 18 heures devant le cinéma. À tout à l'heure !", score: 1, order_index: 9, tags: ["quotidien", "rendez-vous", "A1"], is_validated: true },
    { skill: "CO", level_cecrl: "A2", difficulty: 2, context: "transport", support_type: "annonce_sonore", support: "Gare SNCF.", prompt: "Écoutez l'annonce en gare et répondez à la question.", question: "Quelle est l'information importante concernant le train ?", options: [{ id: "A", text: "Il est supprimé." }, { id: "B", text: "Il change de quai." }, { id: "C", text: "Il a une heure de retard." }], correct_answer: "B", explanation: "« Partira exceptionnellement voie 4 » indique un changement par rapport au quai habituel.", distractors_analysis: "Le train n'est pas supprimé et l'annonce ne donne pas d'information sur un retard.", audio_script: "Votre attention s'il vous plaît. Le train TGV à destination de Lyon partira exceptionnellement voie 4. Éloignez-vous de la bordure du quai.", score: 1, order_index: 10, tags: ["transport", "train", "A2"], is_validated: true },
    { skill: "CO", level_cecrl: "A2", difficulty: 2, context: "sante", support_type: "message_vocal", support: "Téléphone portable.", prompt: "Écoutez ce message de la Sécurité Sociale et répondez à la question.", question: "Que devez-vous envoyer à l'Assurance Maladie ?", options: [{ id: "A", text: "Un arrêt de travail." }, { id: "B", text: "Les coordonnées bancaires (RIB)." }, { id: "C", text: "La nouvelle adresse postale." }], correct_answer: "B", explanation: "Le message réclame un Relevé d'Identité Bancaire (RIB) pour effectuer les remboursements.", distractors_analysis: "Les arrêts de travail (A) et l'adresse (C) ne sont pas demandés dans cet enregistrement.", audio_script: "Bonjour, c'est l'Assurance Maladie. Pour vous rembourser, nous avons besoin de votre RIB. Merci de le déposer rapidement sur votre compte en ligne.", score: 1, order_index: 11, tags: ["sante", "cpam", "A2"], is_validated: true },
    { skill: "CO", level_cecrl: "B1", difficulty: 3, context: "travail", support_type: "message_vocal", support: "Messagerie vocale de téléphone.", prompt: "Écoutez le message du plombier et répondez à la question.", question: "Pourquoi le plombier demande-t-il de le rappeler ?", options: [{ id: "A", text: "Pour s'assurer qu'il y aura quelqu'un à l'appartement demain matin." }, { id: "B", text: "Pour demander l'adresse exacte du logement." }, { id: "C", text: "Pour annuler le rendez-vous d'aujourd'hui." }], correct_answer: "A", explanation: "Il dit « confirmez-moi votre présence », c'est-à-dire qu'il veut être sûr que le locataire sera là pour lui ouvrir.", distractors_analysis: "Il ne demande pas l'adresse (il la connaît via le propriétaire) et n'annule aucun rendez-vous.", audio_script: "Bonjour, c'est le plombier. Votre propriétaire m'a signalé une fuite d'eau chez vous. Je prévois de passer demain matin vers 9 heures. S'il vous plaît, rappelez-moi pour me confirmer votre présence.", score: 2, order_index: 12, tags: ["logement", "artisan", "B1"], is_validated: true },
    { skill: "CO", level_cecrl: "B1", difficulty: 3, context: "transport", support_type: "flash_info", support: "Radio locale.", prompt: "Écoutez ce flash info trafic et répondez à la question.", question: "Quelle est la situation des transports aujourd'hui ?", options: [{ id: "A", text: "Aucun bus ne circule à cause de la neige." }, { id: "B", text: "Presque tous les bus sont bloqués à cause d'une grève." }, { id: "C", text: "Seule la ligne A est en grève." }], correct_answer: "B", explanation: "« Mouvement social » signifie grève. Le trafic est « fortement perturbé », seule la ligne A fonctionne.", distractors_analysis: "L'option C dit l'inverse de la réalité (la ligne A est la seule à marcher). La météo (neige) n'est pas le motif.", audio_script: "Flash info trafic. En raison d'un mouvement social, le réseau des bus est fortement perturbé ce jeudi. Attention, seule la ligne A circule normalement aujourd'hui.", score: 2, order_index: 13, tags: ["transport", "greve", "B1"], is_validated: true },
    { skill: "CO", level_cecrl: "B1", difficulty: 3, context: "travail", support_type: "message_vocal", support: "Téléphone, agence intérim.", prompt: "Écoutez ce message d'un employeur et répondez à la question.", question: "Que vous annonce l'employeur ?", options: [{ id: "A", text: "Vous devez passer un autre entretien." }, { id: "B", text: "Il vous propose de signer un contrat de travail." }, { id: "C", text: "Votre candidature n'est pas acceptée." }], correct_answer: "B", explanation: "« Votre candidature a été retenue » signifie que vous êtes embauché et le but est de « fixer la date de signature du contrat ».", distractors_analysis: "C'est l'inverse d'un refus (C), et l'entretien a déjà eu lieu (A).", audio_script: "Bonjour, suite à votre entretien, j'ai le plaisir de vous annoncer que votre candidature a été retenue. Pouvez-vous me rappeler pour que l'on fixe ensemble la date de signature de votre contrat ?", score: 2, order_index: 14, tags: ["travail", "embauche", "B1"], is_validated: true },
    { skill: "CO", level_cecrl: "B2", difficulty: 4, context: "prefecture", support_type: "message_vocal", support: "Serveur vocal ou agent administratif.", prompt: "Écoutez les explications de l'agent de préfecture et répondez à la question.", question: "Pourquoi la demande de naturalisation pourrait-elle être bloquée ?", options: [{ id: "A", text: "Parce que le paiement de la taxe doit se faire en espèces." }, { id: "B", text: "Parce que le timbre fiscal doit être valide pendant tout l'examen du dossier." }, { id: "C", text: "Parce que le dossier a été envoyé de manière électronique." }], correct_answer: "B", explanation: "L'agent insiste sur le fait que la validité du timbre fiscal doit couvrir toute la période de traitement, sous peine de suspension de la procédure.", distractors_analysis: "L'agent parle d'un timbre « électronique », excluant les espèces (A). L'option C contredit le fait que le timbre doit être électronique.", audio_script: "Pour finaliser votre dossier de demande de naturalisation, l'achat d'un timbre fiscal électronique est indispensable. Veillez surtout à ce que sa durée de validité couvre bien l'intégralité de la période de traitement de votre demande, faute de quoi votre procédure sera automatiquement suspendue.", score: 3, order_index: 15, tags: ["prefecture", "naturalisation", "B2"], is_validated: true },
    { skill: "EE", level_cecrl: "A2", difficulty: 2, context: "logement", support_type: "consigne_ecrite", support: null, prompt: "Rédigez un court message selon la consigne.", question: "Il y a une fuite d'eau dans votre appartement. Écrivez un message (email ou SMS) à votre propriétaire pour lui expliquer le problème et lui demander de venir voir. (40 à 80 mots)", options: null, correct_answer: null, explanation: null, distractors_analysis: null, audio_script: null, score: 1, order_index: 16, tags: ["logement", "probleme", "A2"], is_validated: true },
    { skill: "EE", level_cecrl: "B1", difficulty: 3, context: "mairie", support_type: "consigne_ecrite", support: null, prompt: "Rédigez un message argumenté selon la consigne.", question: "Dans le parc de votre quartier, il n'y a pas assez de poubelles et les déchets s'accumulent. Vous écrivez un e-mail au maire pour signaler ce problème, exprimer votre mécontentement, et proposer une solution concrète. (80 à 130 mots)", options: null, correct_answer: null, explanation: null, distractors_analysis: null, audio_script: null, score: 2, order_index: 17, tags: ["mairie", "citoyennete", "B1"], is_validated: true },
    { skill: "EO", level_cecrl: "B1", difficulty: 3, context: "prefecture", support_type: "consigne_orale", support: null, prompt: "Lisez la situation et enregistrez votre réponse orale.", question: "Vous êtes au guichet de la préfecture pour renouveler votre titre de séjour. L'agent vous dit qu'il manque un document (un justificatif de domicile récent). Expliquez pourquoi vous ne l'avez pas aujourd'hui, excusez-vous, et proposez une solution pour lui transmettre au plus vite (par e-mail ou en revenant cet après-midi). Durée attendue : environ 1 à 2 minutes.", options: null, correct_answer: null, explanation: null, distractors_analysis: null, audio_script: null, score: 2, order_index: 18, tags: ["prefecture", "titre_sejour", "B1"], is_validated: true },
    { skill: "EO", level_cecrl: "B2", difficulty: 4, context: "travail", support_type: "consigne_orale", support: null, prompt: "Lisez la situation et enregistrez votre réponse orale détaillée.", question: "Votre entreprise a décidé d'annuler totalement le télétravail (travail à la maison) et demande à tous les employés de revenir au bureau 5 jours sur 5. Vous n'êtes pas d'accord. Vous allez voir votre responsable pour exprimer clairement votre opinion. Vous devez défendre les avantages du télétravail avec des arguments précis (organisation, écologie, concentration...) et négocier un compromis. Durée attendue : environ 2 à 3 minutes.", options: null, correct_answer: null, explanation: null, distractors_analysis: null, audio_script: null, score: 3, order_index: 19, tags: ["travail", "negociation", "B2"], is_validated: true },
  ],
};

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlJson(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

function sqlArr(v) {
  if (!v || !v.length) return "'{}'::text[]";
  const inner = v.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(",");
  return `'{${inner}}'::text[]`;
}

const pt = diagnostic.placement_test;
const lines = [];
lines.push("DO $$");
lines.push("DECLARE");
lines.push("  v_test_id uuid;");
lines.push("BEGIN");
lines.push(`
  SELECT id INTO v_test_id FROM placement_tests WHERE play_token = 'bff-diagnostic-v1' LIMIT 1;

  IF v_test_id IS NULL THEN
    INSERT INTO placement_tests (
      title, target_exam, target_public, status,
      niveaux_couverts, competences, contexte,
      play_token, published_at, version
    ) VALUES (
      ${sqlStr(pt.title)},
      ${sqlStr(pt.target_exam)},
      ${sqlStr(pt.target_public)},
      ${sqlStr(pt.status)},
      ${sqlArr(pt.niveaux_couverts)},
      ${sqlArr(pt.competences)},
      ${sqlStr(pt.contexte)},
      'bff-diagnostic-v1',
      now(),
      1
    ) RETURNING id INTO v_test_id;
  ELSE
    UPDATE placement_tests SET
      title = ${sqlStr(pt.title)},
      target_exam = ${sqlStr(pt.target_exam)},
      target_public = ${sqlStr(pt.target_public)},
      status = ${sqlStr(pt.status)},
      niveaux_couverts = ${sqlArr(pt.niveaux_couverts)},
      competences = ${sqlArr(pt.competences)},
      contexte = ${sqlStr(pt.contexte)},
      published_at = now(),
      updated_at = now()
    WHERE id = v_test_id;
    DELETE FROM placement_test_items WHERE test_id = v_test_id;
  END IF;
`);

for (const item of diagnostic.items) {
  lines.push(`  INSERT INTO placement_test_items (
    test_id, skill, level_cecrl, difficulty, context, support_type, support,
    prompt, question, options, correct_answer, explanation, distractors_analysis,
    tags, score, order_index, is_validated, audio_script
  ) VALUES (
    v_test_id,
    ${sqlStr(item.skill)},
    ${sqlStr(item.level_cecrl)},
    ${item.difficulty},
    ${sqlStr(item.context)},
    ${sqlStr(item.support_type)},
    ${sqlStr(item.support)},
    ${sqlStr(item.prompt)},
    ${sqlStr(item.question)},
    ${sqlJson(item.options)},
    ${sqlStr(item.correct_answer)},
    ${sqlStr(item.explanation)},
    ${sqlStr(item.distractors_analysis)},
    ${sqlArr(item.tags)},
    ${item.score},
    ${item.order_index},
    ${item.is_validated},
    ${sqlStr(item.audio_script)}
  );`);
}

lines.push("END $$;");

const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seeds", "placement_diagnostic_v1.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
