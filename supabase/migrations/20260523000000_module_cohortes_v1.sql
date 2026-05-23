-- Module cohortes v1 — idempotent
-- Tables: formation_journeys (si absente), cohorts, cohort_sessions, cohort_enrollments, attendance

-- ══════════════════════════════════════════════════════
-- TABLE 0 : public.formation_journeys (prérequis si absente)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.formation_journeys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  title          TEXT NOT NULL,
  slug           TEXT,
  description    TEXT,
  level          TEXT,
  duration_weeks INTEGER,
  price_euros    NUMERIC(10,2),
  status         TEXT DEFAULT 'draft'
);

-- ══════════════════════════════════════════════════════
-- TABLE 1 : public.cohorts
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohorts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  code                      VARCHAR(30) UNIQUE,
  formation_journey_id      UUID REFERENCES public.formation_journeys(id) ON DELETE RESTRICT,
  intensity                 VARCHAR(20) NOT NULL DEFAULT 'standard',
  start_date                DATE NOT NULL,
  estimated_end_date        DATE,
  weekly_schedule           JSONB NOT NULL DEFAULT '[]',
  total_sessions            INTEGER,
  max_students              INTEGER NOT NULL DEFAULT 5,
  min_students_to_confirm   INTEGER NOT NULL DEFAULT 3,
  status                    VARCHAR(20) NOT NULL DEFAULT 'draft',
  visibility                VARCHAR(20) NOT NULL DEFAULT 'private',
  formateur_id              UUID,
  meeting_url               TEXT,
  exam_blank_1_session      INTEGER,
  exam_blank_2_session      INTEGER,
  exam_blank_3_session      INTEGER,
  notes_internes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_cohorts_status      ON public.cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date  ON public.cohorts(start_date);
CREATE INDEX IF NOT EXISTS idx_cohorts_journey_id  ON public.cohorts(formation_journey_id);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 2 : public.cohort_sessions
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  session_number   INTEGER NOT NULL,
  session_date     DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  session_type     VARCHAR(20) NOT NULL DEFAULT 'cours',
  title            VARCHAR(200),
  format           VARCHAR(20) NOT NULL DEFAULT 'visio',
  meeting_url      TEXT,
  location         TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  formateur_id     UUID,
  objectives       TEXT,
  documents        JSONB DEFAULT '[]',
  notes_formateur  TEXT,
  UNIQUE (cohort_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_csessions_cohort_id ON public.cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_csessions_date      ON public.cohort_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_csessions_type      ON public.cohort_sessions(session_type);

ALTER TABLE public.cohort_sessions ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 3 : public.cohort_enrollments
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_mode     VARCHAR(30),
  stripe_payment_intent_id TEXT,
  acompte_paid     BOOLEAN DEFAULT FALSE,
  acompte_amount   NUMERIC(10,2),
  solde_due        NUMERIC(10,2),
  total_paid       NUMERIC(10,2) DEFAULT 0,
  stafy_status     VARCHAR(30) DEFAULT 'not_sent',
  stafy_dossier_id TEXT,
  stafy_transmitted_at TIMESTAMPTZ,
  reserved_at      TIMESTAMPTZ DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  cancellation_reason TEXT,
  CONSTRAINT uq_enrollment_lead_cohort UNIQUE (cohort_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.cohort_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead_id   ON public.cohort_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status    ON public.cohort_enrollments(status);

ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 4 : public.attendance
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id       UUID NOT NULL REFERENCES public.cohort_sessions(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  arrival_time     TIMESTAMPTZ,
  duration_minutes INTEGER,
  signature_method VARCHAR(20),
  signed_at        TIMESTAMPTZ,
  ip_address       TEXT,
  notes            TEXT,
  marked_by        UUID,
  CONSTRAINT uq_attendance_session_lead UNIQUE (session_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lead_id    ON public.attendance(lead_id);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- POLITIQUES RLS (après création de toutes les tables)
-- ══════════════════════════════════════════════════════

-- cohorts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohorts' AND policyname = 'cohorts: staff full access') THEN
    CREATE POLICY "cohorts: staff full access" ON public.cohorts
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohorts' AND policyname = 'cohorts: public open visible') THEN
    CREATE POLICY "cohorts: public open visible" ON public.cohorts
      FOR SELECT TO anon, authenticated
      USING (visibility = 'public' AND status IN ('open', 'confirming', 'confirmed'));
  END IF;
END $$;

-- cohort_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_sessions' AND policyname = 'cohort_sessions: staff full access') THEN
    CREATE POLICY "cohort_sessions: staff full access" ON public.cohort_sessions
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_sessions' AND policyname = 'cohort_sessions: inscrit sees own') THEN
    CREATE POLICY "cohort_sessions: inscrit sees own" ON public.cohort_sessions
      FOR SELECT TO authenticated
      USING (
        cohort_id IN (
          SELECT ce.cohort_id FROM public.cohort_enrollments ce
          JOIN public.leads l ON l.id = ce.lead_id
          WHERE l.email = auth.email()
        )
      );
  END IF;
END $$;

-- cohort_enrollments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: staff full access') THEN
    CREATE POLICY "enrollments: staff full access" ON public.cohort_enrollments
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: inscrit sees own') THEN
    CREATE POLICY "enrollments: inscrit sees own" ON public.cohort_enrollments
      FOR SELECT TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: anon insert') THEN
    CREATE POLICY "enrollments: anon insert" ON public.cohort_enrollments
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- attendance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: staff full access') THEN
    CREATE POLICY "attendance: staff full access" ON public.attendance
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: inscrit sign own') THEN
    CREATE POLICY "attendance: inscrit sign own" ON public.attendance
      FOR UPDATE TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()))
      WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: inscrit read own') THEN
    CREATE POLICY "attendance: inscrit read own" ON public.attendance
      FOR SELECT TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- FONCTION UTILITAIRE
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_cohort_enrolled_count(p_cohort_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
    AND status IN ('confirmed', 'pending');
$$;
