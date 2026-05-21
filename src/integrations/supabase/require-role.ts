import { createMiddleware } from "@tanstack/react-start"
import { requireSupabaseAuth } from "./auth-middleware"
import { supabaseAdmin } from "./client.server"

export type AppRole = "admin" | "gestionnaire" | "conseiller" | "partenaire" | "inscrit"

export const requireRole = (allowedRoles: AppRole[]) =>
  createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const userId = (context as { userId: string }).userId

      const { data: roles, error } = await (supabaseAdmin as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)

      if (error) throw new Error("Erreur de vérification des droits")

      const userRoles = ((roles ?? []) as any[]).map((r) => r.role as AppRole)
      const granted = userRoles.some((r) => allowedRoles.includes(r))

      if (!granted) {
        // Trace tentative d'accès non autorisée
        await (supabaseAdmin as any).from("lead_events").insert({
          lead_id: null,
          event_name: "admin_access_denied",
          properties: { 
            user_id: userId, 
            attempted_roles_required: allowedRoles, 
            user_roles: userRoles 
          },
        })
        throw new Error("Accès refusé : droits insuffisants")
      }

      return next({ context: { ...context, userId, userRoles } })
    })
