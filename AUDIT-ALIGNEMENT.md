# Audit d'alignement Brain ↔ Portal — 2026-05-20

> Audit produit sur l'etat courant des deux worktrees locaux, branches `main`, apres verification des tags `v1.0-pre-alignement` et `v2.0-alignement-complete`.
> Repos inspectes : `bilan-fran-ais-formation` (Portal) et `formateur-connect` (Brain).
> Note : le prompt mentionne 15 criteres de succes, mais n'en liste explicitement que 13. Les criteres #14 et #15 sont donc non verifiables depuis le prompt.

## Synthèse exécutive

Les deux applications partagent une ossature d'alignement reelle : le Portal charge le test public via le Brain, le Brain contient l'algorithme V3 "10 commandements", les offres sont en base `formation_offers`, et les tags d'alignement existent des deux cotes.

Le verdict global reste toutefois : **alignement partiel, pas alignement complet**. Le parcours candidat peut casser au moment du scoring, des fallbacks statiques restent visibles cote Portal, Anthropic est encore appele directement par le Portal, et la documentation de sprint contredit le plan anti-fallback.

Top 3 des findings bloquants :

- 🔴 Le contrat `score-placement-test` est incoherent : le Portal envoie `student_name/answers/source`, le Brain attend `attempt_id/answers` et charge `placement_test_attempts`.
- 🔴 Le Portal conserve une integration Anthropic directe avec `ANTHROPIC_API_KEY`, en violation du critere #8.
- 🔴 Le catalogue d'offres garde un fallback statique silencieux cote Portal, en violation des criteres #7 et #13.

Top 3 des dettes prioritaires :

- 🟠 `recommendedOffer` est stocke par le Brain mais non renvoye dans la reponse HTTP, puis la recommandation est recalculee cote Portal.
- 🟠 Les fonctions appelees `transcribe-audio` et `notify-partner-lead` ne sont pas trouvees dans les Edge Functions du Brain.
- 🟠 La documentation `ARCHITECTURE.md` / `ROLLBACK.md` est presente cote Portal mais obsolète ou contraire au plan anti-fallback, et absente cote Brain.

## 1. Cohérence technique

### Findings classes par gravite

#### 🔴 F1 - Contrat de scoring Brain ↔ Portal casse

- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:155` invoque `score-placement-test`.
- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:514-516` envoie `student_name`, `answers`, `source`.
- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:14` attend `{ attempt_id, answers }`.
- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:23-24` charge `placement_test_attempts` par `attempt_id`.

Impact : le scoring final du parcours `/passer-test/latest` ne peut pas etre considere aligne. Rapport au plan : criteres #1, #2, #3 partiellement compromis en execution bout-en-bout.

#### 🔴 F2 - Anthropic appele directement par le Portal

- Portal : `bilan-fran-ais-formation/src/utils/evaluation-ia.ts:146` lit `process.env.ANTHROPIC_API_KEY`.
- Portal : `bilan-fran-ais-formation/src/utils/evaluation-ia.ts:176` appelle `https://api.anthropic.com/v1/messages`.
- Portal : `bilan-fran-ais-formation/src/utils/evaluation-ia.ts:184` utilise `claude-sonnet-4-6`.
- Portal : `bilan-fran-ais-formation/src/lib/evaluation-production.functions.ts:18` appelle `evaluerProductionEcrite`.

Impact : le critere #8 ("ANTHROPIC_API_KEY unique cote Brain") est viole. Le scoring IA des productions ecrites n'est pas confine au Brain.

#### 🔴 F3 - Fallback statique silencieux des offres

- Portal : `bilan-fran-ais-formation/src/utils/formation-offers.shared.ts:17`, `:33`, `:49`, `:65` contient des prix statiques.
- Portal : `bilan-fran-ais-formation/src/utils/formation-offers.server.ts:15` et `:20` retourne `FALLBACK_JOURNEYS` en cas d'erreur.
- Portal : `bilan-fran-ais-formation/src/hooks/useFormationOffers.ts:25` utilise `initialData: FALLBACK_JOURNEYS`.

Impact : si le Brain/Supabase est down ou lent, le candidat peut voir un catalogue statique sans erreur claire. Rapport au plan : criteres #5, #6, #7, #13.

#### 🔴 F4 - Deux Edge Functions appelees par le Portal ne sont pas trouvees dans le Brain

- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:218` invoque `transcribe-audio`.
- Portal : `bilan-fran-ais-formation/src/routes/qualification.$attemptId.tsx:124` invoque `notify-partner-lead`.
- Brain : le dossier `formateur-connect/supabase/functions/` contient notamment `generate-placement-test`, `get-placement-test`, `score-placement-test`, `claude-generate-exercise`, `claude-review-exercise`, `auto-correct-exercise`, `play-exercise`, `grant-formateur-role`, `debug-env-check`; pas `transcribe-audio` ni `notify-partner-lead`.

Impact : transcription audio et notification partenaire non verifiables/fonctionnellement cassees depuis les repos.

#### 🟠 F5 - `recommendedOffer` calcule par le Brain mais ignore par le Portal

- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:114-128` calcule `recommendedOffer`.
- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:152` stocke `recommended_offer_json`.
- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:183` ne renvoie que `{ success, attempt_id, estimated_level }`.
- Portal : `bilan-fran-ais-formation/src/routes/bilan-test.$attemptId.tsx:106-107` recalcule localement via `getRecommendedJourneyFromList`.

Impact : l'offre recommandee n'est pas consommee comme decision metier Brain dans l'ecran bilan.

#### 🟠 F6 - Secret handling Brain pas strictement unique

- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:72` accepte `ANTHROPIC_API_KEY` ou `CLAUDE_API_KEY`.
- Brain : `formateur-connect/supabase/functions/generate-placement-test/index.ts:62` accepte aussi `ANTHROPIC_API_KEY` ou `CLAUDE_API_KEY`.
- Brain : `formateur-connect/supabase/functions/claude-generate-exercise/index.ts:51` et `claude-review-exercise/index.ts:35` font pareil.

Impact : moins grave que l'appel direct Portal, mais le critere "variable unique" n'est pas strictement applique.

### Diagramme textuel du flux de donnees Brain ↔ Portal

```text
Candidat
  |
  v
Portal /passer-test/latest
  |
  +--> Brain get-placement-test
  |      - Brain lit placement_tests / placement_test_items
  |      - OK pour latest
  |
  +--> Brain transcribe-audio
  |      - fonction non trouvee dans formateur-connect/supabase/functions
  |
  +--> Portal evaluerProductionEcrite
  |      - appelle Anthropic directement via ANTHROPIC_API_KEY
  |
  +--> Brain score-placement-test
         - Portal envoie student_name/answers/source
         - Brain attend attempt_id/answers
         - contrat casse

Portal /bilan-test/$attemptId
  |
  +--> Supabase placement_test_results
  +--> Recommandation locale getRecommendedJourneyFromList
       - n'utilise pas recommended_offer_json comme source de decision affichage

Portal /formations, /index
  |
  +--> Supabase formation_offers
  +--> FALLBACK_JOURNEYS si erreur ou initial render
```

## 2. Cohérence du parcours client

### Schema textuel du funnel candidat

```text
Landing /
  -> /passer-test/latest

/niveaux
  -> /passer-test/latest

/formations
  -> /passer-test/latest

/mon-espace
  -> /passer-test/latest

/passer-test/$token
  -> saisie prenom
  -> items CE / CO / EE / EO
  -> score-placement-test
  -> /bilan-test/$attemptId

/bilan-test/$attemptId
  -> fatigue : ecran bloquant, CTA recommencer
  -> normal/incoherent : bilan + offre + formulaire lead
  -> /qualification/$attemptId

/qualification/$attemptId
  -> simulation financement locale
  -> creation dossier
  -> notify-partner-lead non trouvee
  -> retour accueil
```

### Ruptures identifiees

#### 🔴 R1 - Rupture majeure au scoring

- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:512-517` construit une payload sans `attempt_id`.
- Brain : `formateur-connect/supabase/functions/score-placement-test/index.ts:14` attend `attempt_id`.

Impact candidat : le test peut etre charge et rempli, mais l'acces au bilan peut echouer au moment le plus critique.

#### 🟠 R2 - Identite candidate fragile entre ecrans

- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:22-27` valide `prenom`, `whatsapp`, `type_demarche`, `date_rdv` depuis les search params.
- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:43` initialise uniquement `studentName` depuis `search.prenom`.
- Portal : `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:55` utilise `sessionStorage` avec `test_session_${token}`.

Impact candidat : la reprise existe dans l'onglet/session, mais pas comme reprise robuste depuis la base.

#### 🟠 R3 - Fatigue : modale bloquante sans acces au bilan partiel

- Portal : `bilan-fran-ais-formation/src/routes/bilan-test.$attemptId.tsx:78` detecte `FATIGUE_DETECTEE`.
- Portal : `bilan-fran-ais-formation/src/routes/bilan-test.$attemptId.tsx:82-104` affiche un ecran full-page avec CTA "Recommencer plus tard".

Impact candidat : choix possiblement volontaire, mais rupture nette du parcours "bilan".

#### 🟠 R4 - Qualification depend d'une fonction absente

- Portal : `bilan-fran-ais-formation/src/routes/qualification.$attemptId.tsx:124-126` invoque `notify-partner-lead`.

Impact candidat/partenaire : confirmation interne et notification partenaire non garanties.

## 3. Cohérence design

### Tableau comparatif des tokens

| Token | Portal | Brain | Evaluation |
|---|---|---|---|
| Couleur primaire | `#9d4222` dans `bilan-fran-ais-formation/src/styles.css:67-79` | OKLCH/shadcn, `formateur-connect/src/styles.css:76-121` | Divergence volontaire possible, mais non documentee |
| Couleur secondaire | `#4a654d` Portal | shadcn neutre/bleu Brain | Accidentel si produit unifie |
| Fond | `#fff8f6` Portal | blanc neutre OKLCH Brain | Volontaire plausible candidat vs backoffice |
| Typo | Atkinson Hyperlegible + Work Sans, `bilan-fran-ais-formation/src/styles.css:61-62` | Inter, `formateur-connect/src/styles.css:73` | Divergence non documentee |
| Radius base | `--radius: 0.5rem`, `bilan-fran-ais-formation/src/styles.css:66` | radius/shadcn, `formateur-connect/src/styles.css:21-27` | Proche |
| Buttons | Portal `rounded-lg`, min-height 48/56, `src/components/bff/Button.tsx:7-20` | Brain `rounded-md`, h-9/h-10, `src/components/ui/button.tsx:7-28` | Composants non partages |
| Cards | Portal `rounded-2xl p-6 shadow-sm`, `src/components/bff/Card.tsx:12` | Brain `rounded-xl shadow`, `src/components/ui/card.tsx:12` | Divergence visuelle |
| Systeme | Portal tokens custom Material/accessibilite | Brain shadcn/ui | Pas de design system commun trouve |

### Divergences volontaires vs accidentelles

- Volontaires probables : Portal plus chaleureux et candidat, Brain plus utilitaire/backoffice.
- Accidentelles probables : polices non partagees, composants atomiques dupliques, tokens non mappes, absence de documentation design commune.
- Dette : des couleurs hardcodees subsistent cote Portal, par exemple `bilan-fran-ais-formation/src/routes/index.tsx:51-65`, `src/components/LeadCaptureForm.tsx:275`, `src/routes/admin.tsx:64`.

## 4. Cohérence vocabulaire marketing

### Tableau Terme / Definition / Lieux / Divergences

| Terme | Definition | Lieux | Divergences |
|---|---|---|---|
| Socle Francais | Offre A0 -> A1 | Brain `009_align_formation_offers.sql:10-11`, Portal `formation-offers.shared.ts:10-23` | Aligne |
| Objectif Sejour | Offre A1 -> A2 | Brain `009_align_formation_offers.sql:19-20`, Portal `formation-offers.shared.ts:26-39` | Aligne |
| Objectif Residence | Offre A2 -> B1 | Brain `009_align_formation_offers.sql:28-29`, Portal `formation-offers.shared.ts:42-55` | Aligne |
| Objectif Citoyennete | Offre B1 -> B2 | Brain `009_align_formation_offers.sql:37-38`, Portal `formation-offers.shared.ts:58-71` | Aligne |
| `A0_pre_A1` | Niveau interne scoring Brain | Brain `get-placement-test/index.ts:78-84`, `scoring.ts:26` | Pas dans `NiveauIndicatif` Portal, qui commence a `A1` |
| `B1_nat` | Niveau naturalisation / variante metier | Portal `src/types/bilan.ts:1`, admin filter `admin.leads.tsx:182` | Cohesion partielle, usage heterogene |
| Démarche administrative | Besoin candidat | Portal `src/types/leads.ts:3-8`, `ChecklistDocuments.tsx:4`, `whatsapp-link.ts:1-6` | Vocabulaire divergent : `resident_10ans`, `resident`, `carte_10_ans`, `titre_sejour` |
| `PROFIL_ASYMETRIQUE` | Flag qualite scoring | Brain `scoring.ts:188`, Portal `bilan-test.$attemptId.tsx:243` | Aligne, contrairement au rapport Claude fourni |
| `SOCLE_VALIDE_PAR_PREUVE_*` | Flag preuve/socle | Brain `scoring.ts:95` | Non affiche cote bilan Portal |

### Claims commerciaux + fondement

| Claim | Lieux | Fondement / risque |
|---|---|---|
| `1 formateur référent · 6 élèves max · Paiement x3` | Brain `010_extend_formation_offers.sql:23,35,47,59`, Portal `formation-offers.shared.ts:23,39,55,71`, `email-bilan.ts:56`, `bilan-test.$attemptId.tsx:193` | Aligne, mais duplique par fallback |
| CPF / OPCO / France Travail | Portal `bilan-test.$attemptId.tsx:238`, `index.tsx:83`, `formations.tsx:93,162` | Claim Portal, fondement Brain non structure hors offre/prix |
| Prise en charge totale | Portal `qualification.$attemptId.tsx:275-279` | Simulation locale, pas une decision Brain |
| Expert partenaire / dossier accompagne | Portal `index.tsx:278`, `email-bilan.ts:133`, `accompagnement-administratif.tsx:275` | Claim commercial cote Portal, pas de champ Brain identifie |
| Niveau estime, non certifie | Portal `evaluation-ia.ts:9`, Brain scoring V3 | Cohesion de ton globalement correcte |

## 5. Conformité au plan initial

### Tableau des criteres listes

| # | Critere | Etat | Preuve | Ecart si non tenu |
|---|---|---|---|---|
| 1 | Aucune question ne s'affiche si elle ne vient pas du Brain | ✅ | Portal appelle `get-placement-test` dans `passer-test.$token.tsx:118`; Brain lit `placement_tests` / `placement_test_items` dans `get-placement-test/index.ts:23-48` | Le parcours public principal est Brain-driven. Anciennes routes locales non trouvees comme routes actives dans l'etat courant. |
| 2 | Algorithme 10 commandements implemente et teste (9 profils min) | ✅ | Brain `scoring.ts:2`; tests profils dans `scoring.test.ts:29,48,66,84,98,120,141,159,183,214` | Aucun. |
| 3 | Test accessible via `/passer-test/latest` | ⚠️ | Route `passer-test.$token.tsx:29`; CTAs vers `/passer-test/latest` dans `index.tsx:44-57`, `formations.tsx:182-192`, `niveaux.tsx:158-162` | Accessible, mais le scoring final a un contrat casse. |
| 4 | Page bilan affiche les flags qualitatifs | ⚠️ | Portal affiche fatigue/incoherence/fiabilite `bilan-test.$attemptId.tsx:78-80`, asymetrie `:243`; Brain emet `SOCLE_VALIDE_PAR_PREUVE_*` dans `scoring.ts:95` | `SOCLE_VALIDE_PAR_PREUVE_*` non affiche. |
| 5 | Catalogue d'offres unique cote Brain | ⚠️ | Brain table `formation_offers` dans `006_training_offers_funnel.sql:2`; Portal lit `formation_offers` dans `useFormationOffers.ts:14` | Fallback statique Portal conserve. |
| 6 | Modifier un prix cote Brain change l'affichage Portal | ⚠️ | Mapping DB -> Journey dans `formation-offers.shared.ts`; fallback prix statiques `:17,:33,:49,:65` | Vrai en nominal, faux si fallback ou initialData. |
| 7 | Brain down -> erreur claire, pas de mock | ❌ | `formation-offers.server.ts:15,20` retourne `FALLBACK_JOURNEYS` | Pas d'erreur claire pour les offres. |
| 8 | `ANTHROPIC_API_KEY` unique cote Brain | ❌ | Portal `evaluation-ia.ts:146,176`; Brain accepte aussi `CLAUDE_API_KEY` dans plusieurs fonctions | Portal appelle Anthropic directement. |
| 9 | Claude Sonnet 4.6 utilise partout | ✅ | Brain `claude-generate-exercise/index.ts:82`, `claude-review-exercise/index.ts:53`, `generate-placement-test/index.ts:72`, `score-placement-test/index.ts:83` | Code OK ; doc `ARCHITECTURE.md:18` obsolette. |
| 10 | `ARCHITECTURE.md` a jour | ❌ | Portal `ARCHITECTURE.md:18` mentionne Claude 3.5; `:30` documente fallback statique | Obsolete et contradictoire avec anti-fallback. |
| 11 | `ROLLBACK.md` documente | ⚠️ | Portal `ROLLBACK.md:9` recommande fallback statique; Brain n'a pas de `ROLLBACK.md` racine trouve | Present mais dangereux / incomplet. |
| 12 | Tags `v1.0-pre-alignement` et `v2.0-alignement-complete` pousses | ✅ | `git tag --list` confirme les deux tags dans les deux repos | Aucun. |
| 13 | Pas de fallback silencieux sur mock | ❌ | `formation-offers.server.ts:15,20`; `useFormationOffers.ts:25` | Pattern explicitement encore present. |

### Scope-creep detecte

| Element | Preuve | Jugement |
|---|---|---|
| Admin/partenaire Portal | commits recents `b4932df`, routes `admin.*`, `partenaire.*` | 🟠 Hors plan mais extension produit plausible |
| Espace candidat/login/dashboard | routes `login.tsx`, `dashboard.tsx`, `mon-espace.tsx` | 🟠 Hors plan, pas directement alignement Brain ↔ Portal |
| Tunnel accompagnement administratif | `accompagnement-administratif.tsx:14` | 🟠 Extension commerciale |
| Routes financement/CPF | `financement.tsx:5`, `financement.cpf.tsx:9` | 🟠 Extension marketing |
| Integration IA Portal | `evaluation-ia.ts:146,176` | 🔴 Hors plan et violation #8 |
| `.env` suivi par Git | commande `git -C bilan-fran-ais-formation ls-files .env` retourne `.env` | 🔴 Dette securite/configuration |
| Documentation alignement | commits `33325c1`, fichiers `ARCHITECTURE.md`, `ROLLBACK.md` | 🟠 Necessaire, mais contenu obsolète/contradictoire |

## Annexes

### Liste des fichiers inspectes

Portal :

- `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx`
- `bilan-fran-ais-formation/src/routes/bilan-test.$attemptId.tsx`
- `bilan-fran-ais-formation/src/routes/qualification.$attemptId.tsx`
- `bilan-fran-ais-formation/src/routes/api.capture-lead.ts`
- `bilan-fran-ais-formation/src/routes/index.tsx`
- `bilan-fran-ais-formation/src/routes/formations.tsx`
- `bilan-fran-ais-formation/src/routes/niveaux.tsx`
- `bilan-fran-ais-formation/src/routes/accompagnement-administratif.tsx`
- `bilan-fran-ais-formation/src/hooks/useFormationOffers.ts`
- `bilan-fran-ais-formation/src/utils/formation-offers.shared.ts`
- `bilan-fran-ais-formation/src/utils/formation-offers.server.ts`
- `bilan-fran-ais-formation/src/utils/evaluation-ia.ts`
- `bilan-fran-ais-formation/src/lib/evaluation-production.functions.ts`
- `bilan-fran-ais-formation/src/components/LeadCaptureForm.tsx`
- `bilan-fran-ais-formation/src/components/ChecklistDocuments.tsx`
- `bilan-fran-ais-formation/src/components/bff/Button.tsx`
- `bilan-fran-ais-formation/src/components/bff/Card.tsx`
- `bilan-fran-ais-formation/src/styles.css`
- `bilan-fran-ais-formation/tailwind.config.ts`
- `bilan-fran-ais-formation/ARCHITECTURE.md`
- `bilan-fran-ais-formation/ROLLBACK.md`

Brain :

- `formateur-connect/supabase/functions/get-placement-test/index.ts`
- `formateur-connect/supabase/functions/score-placement-test/index.ts`
- `formateur-connect/supabase/functions/score-placement-test/scoring.ts`
- `formateur-connect/supabase/functions/score-placement-test/scoring.test.ts`
- `formateur-connect/supabase/functions/generate-placement-test/index.ts`
- `formateur-connect/supabase/functions/claude-generate-exercise/index.ts`
- `formateur-connect/supabase/functions/claude-review-exercise/index.ts`
- `formateur-connect/supabase/migrations/003_placement_tests.sql`
- `formateur-connect/supabase/migrations/006_training_offers_funnel.sql`
- `formateur-connect/supabase/migrations/007_placement_results_flags.sql`
- `formateur-connect/supabase/migrations/009_align_formation_offers.sql`
- `formateur-connect/supabase/migrations/010_extend_formation_offers.sql`
- `formateur-connect/supabase/migrations/011_add_objective_to_formation_offers.sql`
- `formateur-connect/src/styles.css`
- `formateur-connect/src/components/ui/button.tsx`
- `formateur-connect/src/components/ui/card.tsx`
- `formateur-connect/src/components/AppLayout.tsx`

### Commandes executees et resultats bruts

```bash
git -C bilan-fran-ais-formation fetch --tags origin
git -C formateur-connect fetch --tags origin
git -C bilan-fran-ais-formation rev-list --left-right --count main...origin/main
git -C formateur-connect rev-list --left-right --count main...origin/main
git -C bilan-fran-ais-formation tag --list "v1.0-pre-alignement"
git -C bilan-fran-ais-formation tag --list "v2.0-alignement-complete"
git -C formateur-connect tag --list "v1.0-pre-alignement"
git -C formateur-connect tag --list "v2.0-alignement-complete"
```

Resultat brut utile : les deux repos sont a jour (`0 0`) et les tags `v1.0-pre-alignement` / `v2.0-alignement-complete` sont presents des deux cotes.

```bash
rg -n "FALLBACK|fallback|scoringFallback|MOCK|mock_" bilan-fran-ais-formation/src
rg -n "ANTHROPIC|api.anthropic.com|claude-" bilan-fran-ais-formation/src formateur-connect/supabase/functions
rg -n "\b(2400|2800|3500|4500|publicPrice|monthlyInstallment)\b" bilan-fran-ais-formation/src
rg -n "functions.invoke|/functions/v1/" bilan-fran-ais-formation/src
```

Resultats bruts utiles :

- `bilan-fran-ais-formation/src/utils/evaluation-ia.ts:146` lit `ANTHROPIC_API_KEY`.
- `bilan-fran-ais-formation/src/utils/evaluation-ia.ts:176` appelle `api.anthropic.com`.
- `bilan-fran-ais-formation/src/utils/formation-offers.server.ts:15,20` retourne `FALLBACK_JOURNEYS`.
- `bilan-fran-ais-formation/src/hooks/useFormationOffers.ts:25` utilise `initialData: FALLBACK_JOURNEYS`.
- `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:218` invoque `transcribe-audio`.
- `bilan-fran-ais-formation/src/routes/qualification.$attemptId.tsx:124` invoque `notify-partner-lead`.

```bash
rg -n "recommendedOffer|recommended_offer|score-placement-test|attempt_id|student_name|answers|source|estimated_level|return new Response" bilan-fran-ais-formation/src/routes formateur-connect/supabase/functions/score-placement-test/index.ts
```

Resultats bruts utiles :

- Brain attend `attempt_id` dans `formateur-connect/supabase/functions/score-placement-test/index.ts:14`.
- Portal envoie `student_name`, `answers`, `source` dans `bilan-fran-ais-formation/src/routes/passer-test.$token.tsx:514-516`.
- Brain stocke `recommended_offer_json` dans `score-placement-test/index.ts:152`.
- Brain ne renvoie pas `recommendedOffer` dans `score-placement-test/index.ts:183`.

```bash
rg -n "SOCLE_VALIDE|PROFIL_ASYMETRIQUE|FATIGUE_DETECTEE|FIABILITE_FAIBLE|ALERTE_VITESSE|PROFIL_INCOHERENT" bilan-fran-ais-formation/src/routes/bilan-test.$attemptId.tsx formateur-connect/supabase/functions/score-placement-test/scoring.ts formateur-connect/supabase/migrations/007_placement_results_flags.sql
```

Resultats bruts utiles :

- Brain documente tous les flags dans `007_placement_results_flags.sql:8`.
- Brain emet `SOCLE_VALIDE_PAR_PREUVE_*` dans `scoring.ts:95`.
- Portal gere `FATIGUE_DETECTEE`, `PROFIL_INCOHERENT`, `ALERTE_VITESSE_INCOHERENTE`, `FIABILITE_FAIBLE_*` dans `bilan-test.$attemptId.tsx:78-80`.
- Portal affiche `PROFIL_ASYMETRIQUE` dans `bilan-test.$attemptId.tsx:243`.

```bash
rg -n "Claude 3.5|fallback statique|formation_offers|ROLLBACK|ARCHITECTURE|Claude|Sonnet" bilan-fran-ais-formation/ARCHITECTURE.md bilan-fran-ais-formation/ROLLBACK.md
git -C bilan-fran-ais-formation ls-files .env
```

Resultats bruts utiles :

- `ARCHITECTURE.md:18` mentionne encore `Claude 3.5 Sonnet`.
- `ARCHITECTURE.md:30` documente un fallback statique.
- `ROLLBACK.md:9` recommande de forcer les valeurs statiques de secours.
- `.env` est suivi par Git cote Portal.

