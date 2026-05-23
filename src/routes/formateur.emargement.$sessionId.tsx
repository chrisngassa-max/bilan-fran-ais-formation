import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Printer, Hash } from "lucide-react";
import {
  getSessionDetailFn,
  marquerPresenceFn,
} from "@/lib/formateur.functions";

export const Route = createFileRoute("/formateur/emargement/$sessionId")({
  component: EmargementPage,
});

function EmargementPage() {
  const { sessionId } = Route.useParams();
  const getDetail = useServerFn(getSessionDetailFn);
  const marquer = useServerFn(marquerPresenceFn);
  const qc = useQueryClient();
  const [code, setCode] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => getDetail({ data: { sessionId } }),
  });

  const mut = useMutation({
    mutationFn: (vars: { leadId: string; status: "present" | "absent" }) =>
      marquer({
        data: { sessionId, leadId: vars.leadId, status: vars.status },
      }),
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["session-detail", sessionId] });
    },
  });

  const generateCode = () => {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    setCode(c);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
        Chargement...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-sm font-bold text-red-700">
        {(error as any)?.message || "Erreur de chargement"}
      </div>
    );
  }

  const { session, cohort, apprenants } = data;
  const dateStr = new Date(session.session_date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="space-y-6">
        <div className="no-print">
          <h1 className="text-2xl md:text-3xl font-black text-on-surface">
            Émargement — Séance n°{session.session_number}
          </h1>
          <p className="text-sm font-bold text-on-surface-variant mt-1">
            {cohort.code} · {dateStr} · {session.start_time?.slice(0, 5)} →{" "}
            {session.end_time?.slice(0, 5)}
          </p>
        </div>

        {/* Code de présence */}
        <div className="no-print bg-white rounded-2xl border border-outline-variant p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Hash size={18} /> Code de présence
              </h2>
              <p className="text-xs font-bold text-on-surface-variant">
                Communiquez ce code à vos apprenants pour qu'ils émargent eux-mêmes.
              </p>
            </div>
            <button
              onClick={generateCode}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90"
            >
              {code ? "Régénérer" : "Générer le code"}
            </button>
          </div>
          {code && (
            <div className="text-center py-8 bg-surface rounded-xl border-2 border-dashed border-primary">
              <div className="text-6xl md:text-8xl font-black text-primary tracking-widest">
                {code}
              </div>
            </div>
          )}
        </div>

        {/* Liste apprenants */}
        <div className="no-print bg-white rounded-2xl border border-outline-variant overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-black text-on-surface">
              Apprenants attendus ({apprenants.length})
            </h2>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface/70"
            >
              <Printer size={14} /> Télécharger la feuille (PDF)
            </button>
          </div>

          {apprenants.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
              Aucun apprenant inscrit à cette cohorte.
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/50">
              {apprenants.map((a: any) => {
                const isMarked = a.status === "present" || a.status === "absent";
                const showActions = !isMarked || editing === a.lead_id;
                return (
                  <li
                    key={a.lead_id}
                    className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <div className="font-bold text-on-surface">
                        {a.prenom || "—"}
                      </div>
                      <div className="text-xs text-on-surface-variant">{a.email}</div>
                      {a.signed_at && (
                        <div className="text-xs text-on-surface-variant mt-1">
                          Émargé à{" "}
                          {new Date(a.signed_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {a.status === "present" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 rounded-lg font-bold text-xs">
                          <CheckCircle2 size={14} /> Présent
                        </span>
                      )}
                      {a.status === "absent" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-800 rounded-lg font-bold text-xs">
                          <XCircle size={14} /> Absent
                        </span>
                      )}
                      {a.status === "pending" && !showActions && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg font-bold text-xs">
                          <Clock size={14} /> En attente
                        </span>
                      )}

                      {showActions ? (
                        <>
                          <button
                            disabled={mut.isPending}
                            onClick={() =>
                              mut.mutate({ leadId: a.lead_id, status: "present" })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> Présent
                          </button>
                          <button
                            disabled={mut.isPending}
                            onClick={() =>
                              mut.mutate({ leadId: a.lead_id, status: "absent" })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Absent
                          </button>
                          {editing === a.lead_id && (
                            <button
                              onClick={() => setEditing(null)}
                              className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg font-bold text-xs"
                            >
                              Annuler
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => setEditing(a.lead_id)}
                          className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg font-bold text-xs hover:bg-surface/70"
                        >
                          Corriger
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Feuille imprimable */}
        <div className="print-only">
          <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
            BFF — Bilan Français Formation
          </h1>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Feuille d'émargement
          </h2>
          <p style={{ marginBottom: 4 }}>
            <strong>Cohorte :</strong> {cohort.code} — {cohort.title}
          </p>
          <p style={{ marginBottom: 4 }}>
            <strong>Séance n°{session.session_number}</strong> du {dateStr}
          </p>
          <p style={{ marginBottom: 16 }}>
            Horaires : {session.start_time?.slice(0, 5)} →{" "}
            {session.end_time?.slice(0, 5)}
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>Prénom</th>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>Heure d'arrivée</th>
                <th style={{ ...cellStyle, width: 160 }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {apprenants.map((a: any) => (
                <tr key={a.lead_id}>
                  <td style={cellStyle}>{a.prenom || ""}</td>
                  <td style={cellStyle}>{a.email}</td>
                  <td style={{ ...cellStyle, height: 40 }}></td>
                  <td style={{ ...cellStyle, height: 40 }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #333",
  padding: "6px 8px",
  textAlign: "left",
};
