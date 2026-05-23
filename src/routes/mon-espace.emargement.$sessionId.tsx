import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { getEmargementContextFn, submitEmargementFn } from "@/lib/apprenant.functions";
import { ApprenantLayout, formatDateFrLong, formatTime } from "@/components/apprenant/ApprenantLayout";

export const Route = createFileRoute("/mon-espace/emargement/$sessionId")({
  head: () => ({
    meta: [
      { title: "Émargement — Espace apprenant | Bilan Français Formation" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmargementPage,
});

function EmargementPage() {
  const { sessionId } = Route.useParams();
  const fn = useServerFn(getEmargementContextFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["apprenant", "emargement", sessionId],
    queryFn: () => fn({ data: { sessionId } }),
  });

  return (
    <ApprenantLayout>
      <div>
        <Link
          to="/mon-espace/mes-seances"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à mes séances
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-900">
          {(error as Error).message}
        </div>
      )}
      {data && !data.ok && <NotEligible reason={data.reason} />}
      {data && data.ok && <EmargementForm sessionId={sessionId} session={data.session} attendance={data.attendance} />}
    </ApprenantLayout>
  );
}

function NotEligible({ reason }: { reason: string }) {
  const messages: Record<string, string> = {
    no_lead: "Aucun profil apprenant trouvé pour votre compte.",
    no_session: "Cette séance est introuvable.",
    not_enrolled: "Vous n'êtes pas inscrit(e) à la cohorte de cette séance.",
    no_attendance: "Vous n'êtes pas attendu(e) à cette séance.",
  };
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <p className="text-sm text-gray-800">{messages[reason] ?? "Action impossible."}</p>
    </div>
  );
}

function EmargementForm({
  sessionId,
  session,
  attendance,
}: {
  sessionId: string;
  session: any;
  attendance: any;
}) {
  const queryClient = useQueryClient();
  const submit = useServerFn(submitEmargementFn);
  const [mode, setMode] = useState<"click" | "code" | "absent">("click");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "present" | "absent">(null);
  const [err, setErr] = useState<string | null>(null);

  if (attendance.signed_at) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-emerald-900">
          Vous avez émargé le{" "}
          {new Date(attendance.signed_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          à{" "}
          {new Date(attendance.signed_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          . ✅
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-emerald-900 mb-4">
          {done === "present"
            ? "Présence enregistrée. Merci !"
            : "Absence déclarée."}
        </p>
        <Link
          to="/mon-espace/mes-seances"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          ← Retour à mes séances
        </Link>
      </div>
    );
  }

  async function onSubmit() {
    setBusy(true);
    setErr(null);
    try {
      await submit({
        data: {
          sessionId,
          mode,
          code: mode === "code" ? code : undefined,
          notes: mode === "absent" ? notes : undefined,
        },
      });
      setDone(mode === "absent" ? "absent" : "present");
      queryClient.invalidateQueries({ queryKey: ["apprenant"] });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Séance n°{session.session_number}
          {session.title && <span className="text-gray-500"> — {session.title}</span>}
        </h2>
        <p className="text-sm text-gray-700 mt-1">{formatDateFrLong(session.session_date)}</p>
        <p className="text-xs text-gray-500">
          {formatTime(session.start_time)} – {formatTime(session.end_time)}
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Confirmez votre présence à cette séance</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {([
            ["click", "Confirmation simple"],
            ["code", "Code formateur"],
            ["absent", "Absence"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                mode === k
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "code" && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Code à 4 chiffres communiqué par votre formateur
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest"
            placeholder="••••"
          />
          <p className="text-xs text-gray-500 mt-2">
            Le code vous est communiqué par votre formateur.
            Il simplifie l'identification mais n'est pas cryptographiquement vérifié.
          </p>
        </div>
      )}

      {mode === "absent" && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Motif (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ex : maladie, empêchement professionnel…"
          />
        </div>
      )}

      {mode === "click" && (
        <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
          Je confirme être présent(e) à cette séance.
        </p>
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
          {err}
        </div>
      )}

      <button
        type="button"
        disabled={busy || (mode === "code" && code.length !== 4)}
        onClick={onSubmit}
        className="w-full px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin inline" />
        ) : mode === "absent" ? (
          "Déclarer mon absence"
        ) : mode === "code" ? (
          "Valider ma présence"
        ) : (
          "Signer mon émargement"
        )}
      </button>
    </div>
  );
}
