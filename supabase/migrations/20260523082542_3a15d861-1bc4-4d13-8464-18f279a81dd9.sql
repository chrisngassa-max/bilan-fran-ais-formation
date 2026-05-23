-- Cohorts
DROP POLICY IF EXISTS "cohorts: staff full access" ON public.cohorts;

CREATE POLICY "cohorts: admin full access" ON public.cohorts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cohorts: gestionnaire own only" ON public.cohorts
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  );

CREATE POLICY "cohorts: gestionnaire update own" ON public.cohorts
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  );

-- Cohort sessions
DROP POLICY IF EXISTS "cohort_sessions: staff full access" ON public.cohort_sessions;

CREATE POLICY "cohort_sessions: admin full access" ON public.cohort_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cohort_sessions: gestionnaire own" ON public.cohort_sessions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  );

-- Cohort enrollments
DROP POLICY IF EXISTS "enrollments: staff full access" ON public.cohort_enrollments;

CREATE POLICY "enrollments: admin full access" ON public.cohort_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "enrollments: gestionnaire own cohorts" ON public.cohort_enrollments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  );

-- Attendance
DROP POLICY IF EXISTS "attendance: staff full access" ON public.attendance;

CREATE POLICY "attendance: admin full access" ON public.attendance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "attendance: gestionnaire own sessions" ON public.attendance
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND session_id IN (
      SELECT cs.id FROM public.cohort_sessions cs
      JOIN public.cohorts c ON c.id = cs.cohort_id
      WHERE c.formateur_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND session_id IN (
      SELECT cs.id FROM public.cohort_sessions cs
      JOIN public.cohorts c ON c.id = cs.cohort_id
      WHERE c.formateur_id = auth.uid()
    )
  );