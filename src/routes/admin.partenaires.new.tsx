import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPartnerAdminFn } from "../lib/admin.functions";
import { ArrowLeft, Handshake, Save, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partenaires/new")({
  head: () => ({
    meta: [
      { title: "Nouveau Partenaire Agrée — Administration" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PartnerNew,
});

export function PartnerNew() {
  const createPartner = useServerFn(createPartnerAdminFn);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "inactive">("draft");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [transmissionMode, setTransmissionMode] = useState<"manual_csv" | "manual_pdf" | "email" | "future_api">("manual_csv");
  const [receptionEmail, setReceptionEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // Compliance States
  const [kbisVerified, setKbisVerified] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);

  const [busy, setBusy] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createPartner({
        data: {
          name,
          slug,
          contactName,
          contactEmail,
          contactWhatsapp,
          status,
          serviceTypes,
          transmissionMode,
          receptionEmail,
          webhookUrl,
          legalNotes,
          kbisVerified,
          insuranceVerified,
          contractSigned
        }
      });
      toast.success("Partenaire créé avec succès !");
      navigate({ to: "/admin/partenaires" });
    } catch (err: any) {
      toast.error(err.message || "Erreur de création du partenaire");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleService = (type: string) => {
    if (serviceTypes.includes(type)) {
      setServiceTypes(serviceTypes.filter((t) => t !== type));
    } else {
      setServiceTypes([...serviceTypes, type]);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 pb-4 border-b border-outline-variant/30">
        <Link to="/admin/partenaires" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft size={14} />
          Retour aux partenaires
        </Link>
        <h1 className="text-3xl font-black text-on-surface flex items-center gap-2.5">
          <Handshake size={28} className="text-primary" />
          Enregistrer un Partenaire Agréé
        </h1>
        <p className="text-sm text-on-surface-variant">Remplissez les informations de contact, de transmission et de conformité.</p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile and Settings (2 Columns) */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">Informations Générales</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Nom de l'Organisme</span>
              <input
                type="text"
                required
                placeholder="Ex: Expert Préfecture Paris"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Slug (URL unique)</span>
              <input
                type="text"
                required
                placeholder="expert-prefecture-paris"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary font-mono text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Nom du Contact Référent</span>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Email du Référent</span>
              <input
                type="email"
                placeholder="contact@expert.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">WhatsApp / Téléphone</span>
              <input
                type="text"
                placeholder="+33612345678"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Statut initial</span>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-3 text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
              >
                <option value="draft">Brouillon (Non accessible)</option>
                <option value="active">Actif (Prêt pour transmissions)</option>
                <option value="inactive">Inactif (Verrouillé)</option>
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-bold text-on-surface block">Types d'accompagnements proposés</span>
            <div className="flex flex-wrap gap-3">
              {["carte_sejour", "naturalisation", "resident", "je_ne_sais_pas", "autre"].map((type) => {
                const selected = serviceTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleService(type)}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5
                      ${selected 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                      }
                    `}
                  >
                    {selected && <Check size={12} />}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/20 pt-4 pb-2">Paramètres de Transmission</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Mode de Transmission</span>
              <select
                value={transmissionMode}
                onChange={(e: any) => setTransmissionMode(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-3 text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
              >
                <option value="manual_csv">Export CSV manuel</option>
                <option value="manual_pdf">Génération PDF manuelle</option>
                <option value="email">Envoi Email sécurisé</option>
                <option value="future_api">API Webhook</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Email de réception des dossiers</span>
              <input
                type="email"
                placeholder="dossier@expert.com"
                value={receptionEmail}
                onChange={(e) => setReceptionEmail(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-bold text-on-surface">URL de Webhook (API)</span>
              <input
                type="url"
                placeholder="https://api.partner.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-4 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>
          </div>
        </div>

        {/* Side Panel: Legal Compliance & Notes (1 Column) */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">Dossier Juridique</h2>
            
            <div className="space-y-4 text-sm font-semibold text-on-surface">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={kbisVerified}
                  onChange={(e) => setKbisVerified(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <p>Extrait KBIS validé</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Registre de commerce de moins de 3 mois</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={insuranceVerified}
                  onChange={(e) => setInsuranceVerified(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <p>Attestation d'Assurance RC Pro</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Responsabilité civile valide pour l'année en cours</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={contractSigned}
                  onChange={(e) => setContractSigned(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <p>Contrat d'intermédiation signé</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Convention de traitement RGPD acceptée</p>
                </div>
              </label>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-on-surface">Notes juridiques internes</span>
              <textarea
                placeholder="Renseignez des notes internes (ex : numéro de contrat, conditions spécifiques)..."
                value={legalNotes}
                onChange={(e) => setLegalNotes(e.target.value)}
                className="w-full h-32 rounded-lg border border-outline-variant bg-surface p-3 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </label>
          </section>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-on-primary shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <Save size={18} />
                Enregistrer le Partenaire
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
