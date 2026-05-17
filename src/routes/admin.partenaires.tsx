import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPartnersAdminFn, updatePartnerAdminFn } from "../lib/admin.functions";
import { 
  Plus, 
  Handshake, 
  Mail, 
  Phone, 
  FileCheck, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partenaires")({
  head: () => ({
    meta: [
      { title: "Gestion des Partenaires Habilités — Administration" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPartners,
});

const STATUS_BADGES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  draft: "Brouillon",
  inactive: "Inactif",
};

export function AdminPartners() {
  const getPartners = useServerFn(getPartnersAdminFn);
  const updatePartner = useServerFn(updatePartnerAdminFn);
  const navigate = useNavigate();

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPartners();
      setPartners(res);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les partenaires");
    } finally {
      setLoading(false);
    }
  }, [getPartners]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleToggleStatus = async (partner: any) => {
    const nextStatus = partner.status === "active" ? "inactive" : "active";
    try {
      await updatePartner({
        data: {
          id: partner.id,
          partner: {
            name: partner.name,
            slug: partner.slug,
            contactName: partner.contact_name,
            contactEmail: partner.contact_email || "",
            contactWhatsapp: partner.contact_whatsapp,
            status: nextStatus,
            serviceTypes: partner.service_types || [],
            transmissionMode: partner.transmission_mode || "manual_csv",
            receptionEmail: partner.reception_email || "",
            webhookUrl: partner.webhook_url || "",
            legalNotes: partner.legal_notes || "",
            kbisVerified: partner.kbis_verified,
            insuranceVerified: partner.insurance_verified,
            contractSigned: partner.contract_signed
          }
        }
      });
      toast.success(`Partenaire ${nextStatus === "active" ? "activé" : "désactivé"} avec succès !`);
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || "Erreur de modification");
    }
  };

  const handleToggleDoc = async (partner: any, docType: "kbis" | "insurance" | "contract") => {
    const updatePayload = {
      name: partner.name,
      slug: partner.slug,
      contactName: partner.contact_name,
      contactEmail: partner.contact_email || "",
      contactWhatsapp: partner.contact_whatsapp,
      status: partner.status,
      serviceTypes: partner.service_types || [],
      transmissionMode: partner.transmission_mode || "manual_csv",
      receptionEmail: partner.reception_email || "",
      webhookUrl: partner.webhook_url || "",
      legalNotes: partner.legal_notes || "",
      kbisVerified: partner.kbis_verified,
      insuranceVerified: partner.insurance_verified,
      contractSigned: partner.contract_signed
    };

    if (docType === "kbis") updatePayload.kbisVerified = !partner.kbis_verified;
    if (docType === "insurance") updatePayload.insuranceVerified = !partner.insurance_verified;
    if (docType === "contract") updatePayload.contractSigned = !partner.contract_signed;

    try {
      await updatePartner({
        data: {
          id: partner.id,
          partner: updatePayload
        }
      });
      toast.success("Statut de conformité mis à jour !");
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || "Erreur de modification");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Partenaires Agréés</h1>
          <p className="text-sm text-on-surface-variant mt-1">Gérez et auditez les organismes externes habilités à accompagner les candidats.</p>
        </div>
        <button
          onClick={() => navigate({ to: "/admin/partenaires/new" })}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-on-primary px-4 text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Nouveau partenaire
        </button>
      </header>

      {/* Partners List */}
      <section className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement des partenaires...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-white space-y-2">
            <p className="font-extrabold text-lg">Aucun partenaire enregistré</p>
            <p className="text-sm">Cliquez sur "Nouveau partenaire" pour ajouter votre premier expert agréé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                  <th className="px-6 py-4">Nom / Contact</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Dossiers transmis</th>
                  <th className="px-6 py-4">Dossier Juridique (Conformité)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {partners.map((partner) => {
                  const legalCompliant = partner.kbis_verified && partner.insurance_verified && partner.contract_signed;
                  return (
                    <tr key={partner.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-surface text-base flex items-center gap-2">
                          <Handshake size={18} className="text-primary" />
                          {partner.name}
                        </div>
                        <div className="flex flex-col gap-1 mt-1.5 text-xs text-on-surface-variant">
                          <span className="font-mono bg-surface px-1.5 py-0.5 rounded text-[10px] self-start">/{partner.slug}</span>
                          {partner.contact_name && (
                            <span className="font-medium text-on-surface">Référent : {partner.contact_name}</span>
                          )}
                          <div className="flex items-center gap-3 mt-0.5">
                            {partner.contact_email && (
                              <span className="flex items-center gap-1"><Mail size={12} /> {partner.contact_email}</span>
                            )}
                            {partner.contact_whatsapp && (
                              <span className="flex items-center gap-1"><Phone size={12} /> {partner.contact_whatsapp}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGES[partner.status] || "bg-gray-100 text-gray-800"}`}>
                          {STATUS_LABELS[partner.status] || partner.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-on-surface text-lg">{partner.transmissions_count}</div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">dossier(s) transféré(s)</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleDoc(partner, "kbis")}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border transition-colors ${partner.kbis_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                            >
                              <FileCheck size={12} /> KBIS
                            </button>
                            <button
                              onClick={() => handleToggleDoc(partner, "insurance")}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border transition-colors ${partner.insurance_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                            >
                              <FileCheck size={12} /> Assurances
                            </button>
                            <button
                              onClick={() => handleToggleDoc(partner, "contract")}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border transition-colors ${partner.contract_signed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                            >
                              <FileCheck size={12} /> Contrat
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            {legalCompliant ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={14} /> Dossier conforme</span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-bold"><AlertCircle size={14} /> Pièces manquantes</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(partner)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-white px-3 text-xs font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
                          >
                            {partner.status === "active" ? (
                              <>
                                <ToggleRight size={18} className="text-emerald-500" /> Désactiver
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={18} className="text-on-surface-variant" /> Activer
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
