-- Helper: SECURITY DEFINER to avoid recursion when policies query user_roles
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, target_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = target_role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- ====== lead_events ======
DROP POLICY IF EXISTS "user_roles select all auth" ON public.lead_events;
DROP POLICY IF EXISTS "user_roles insert all auth" ON public.lead_events;

CREATE POLICY "lead_events: staff read" ON public.lead_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

CREATE POLICY "lead_events: admin insert" ON public.lead_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ====== partners ======
DROP POLICY IF EXISTS "Allow authenticated users full access to partners" ON public.partners;

CREATE POLICY "partners: admin+gestionnaire read" ON public.partners
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));

CREATE POLICY "partners: admin insert" ON public.partners
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "partners: admin update" ON public.partners
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "partners: admin delete" ON public.partners
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ====== partner_transmissions ======
DROP POLICY IF EXISTS "Allow authenticated users full access to transmissions" ON public.partner_transmissions;

CREATE POLICY "transmissions: admin+gestionnaire read" ON public.partner_transmissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));

CREATE POLICY "transmissions: admin+gestionnaire insert" ON public.partner_transmissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
