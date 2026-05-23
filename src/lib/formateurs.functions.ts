import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/integrations/supabase/require-role";

const supabaseAdmin: any = _supabaseAdmin;

// ---------- List formateurs (gestionnaires) ----------
export const getFormateursFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .handler(async () => {
    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "gestionnaire");
    if (roleErr) throw new Error(roleErr.message);

    const userIds: string[] = (roleRows ?? []).map((r: any) => r.user_id);
    if (userIds.length === 0) return { formateurs: [] };

    const formateurs = await Promise.all(
      userIds.map(async (uid) => {
        const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(uid);
        const { count } = await supabaseAdmin
          .from("cohorts")
          .select("id", { count: "exact", head: true })
          .eq("formateur_id", uid);
        const roleRow = (roleRows ?? []).find((r: any) => r.user_id === uid);
        return {
          id: uid,
          email: userRes?.user?.email ?? "—",
          created_at: roleRow?.created_at ?? userRes?.user?.created_at ?? null,
          nb_cohortes: count ?? 0,
        };
      }),
    );

    return { formateurs };
  });

// ---------- Invite formateur ----------
export const inviterFormateurFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((input) =>
    z.object({ email: z.string().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (error) throw new Error(error.message);
    const newUserId = invited?.user?.id;
    if (!newUserId) throw new Error("Impossible de créer l'utilisateur");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "gestionnaire" });
    // Ignore duplicate role
    if (roleErr && !roleErr.message?.includes("duplicate")) {
      throw new Error(roleErr.message);
    }

    return { success: true, user_id: newUserId };
  });

// ---------- Remove formateur role ----------
export const supprimerFormateurFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "gestionnaire");
    if (error) throw new Error(error.message);
    return { success: true };
  });
