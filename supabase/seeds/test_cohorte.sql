-- ============================================================
-- SEED DE TEST : Cohorte complète pour validation bout en bout
-- ============================================================
-- À exécuter via l'éditeur SQL (pas une migration — données de test)
-- Tous les UUID sont littéraux pour être retrouvables facilement

-- ============================================================
-- ÉTAPE 1 — Parcours de formation
-- ============================================================
INSERT INTO public.formation_journeys (id, title, slug, level, duration_weeks, price_euros, status)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'Préparation B2 — Naturalisation',
  'b2-naturalisation',
  'B2', 12, 1200.00, 'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 2 — Cohorte test
-- ============================================================
INSERT INTO public.cohorts (
  id, code, formation_journey_id, intensity,
  start_date, estimated_end_date,
  weekly_schedule, total_sessions,
  max_students, min_students_to_confirm,
  status, visibility,
  exam_blank_1_session, exam_blank_2_session, exam_blank_3_session,
  meeting_url
) VALUES (
  '22222222-0000-0000-0000-000000000001',
  'B2-STD-2026-S22',
  '11111111-0000-0000-0000-000000000001',
  'standard',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '12 weeks',
  '[{"day":1,"start":"18:00","end":"21:00"},{"day":4,"start":"18:00","end":"21:00"}]',
  6, 5, 3,
  'open', 'public',
  3, 5, 6,
  'https://meet.google.com/test-cohorte'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 3 — 6 séances (dont 3 examens blancs aux jalons)
-- ============================================================
INSERT INTO public.cohort_sessions
  (id, cohort_id, session_number, session_date, start_time, end_time,
   duration_minutes, session_type, format, status, meeting_url)
VALUES
  ('33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
   1, CURRENT_DATE - INTERVAL '2 days','18:00','21:00',180,'cours','visio','completed',
   'https://meet.google.com/test-cohorte'),
  ('33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000001',
   2, CURRENT_DATE - INTERVAL '1 day','18:00','21:00',180,'cours','visio','completed',
   'https://meet.google.com/test-cohorte'),
  ('33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000001',
   3, CURRENT_DATE + INTERVAL '2 days','18:00','21:00',180,'exam_blanc','visio','scheduled',
   'https://meet.google.com/test-cohorte'),
  ('33333333-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000001',
   4, CURRENT_DATE + INTERVAL '5 days','18:00','21:00',180,'cours','visio','scheduled',
   'https://meet.google.com/test-cohorte'),
  ('33333333-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000001',
   5, CURRENT_DATE + INTERVAL '8 days','18:00','21:00',180,'exam_blanc','visio','scheduled',
   'https://meet.google.com/test-cohorte'),
  ('33333333-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000001',
   6, CURRENT_DATE + INTERVAL '11 days','18:00','21:00',180,'exam_blanc','visio','scheduled',
   'https://meet.google.com/test-cohorte')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 4 — Lead test
-- ============================================================
INSERT INTO public.leads (
  id, first_name, email, whatsapp_phone,
  source, tunnel, status,
  consent_marketing, partenaire_consent, consent_at,
  estimated_level
) VALUES (
  '44444444-0000-0000-0000-000000000001',
  'Alice Test',
  'alice.test@bilanfrancaisformation.fr',
  '+33600000001',
  'session_directe', 'T0_inscription_directe', 'new',
  true, false, now(),
  'B1'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 5 — Inscription (enrollment)
-- ============================================================
INSERT INTO public.cohort_enrollments (
  id, cohort_id, lead_id, status, payment_mode, reserved_at
) VALUES (
  '55555555-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000001',
  '44444444-0000-0000-0000-000000000001',
  'pending', 'direct', now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 6 — Attendance (une entrée par séance)
-- ============================================================
INSERT INTO public.attendance (session_id, lead_id, status)
VALUES
  ('33333333-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001','present'),
  ('33333333-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000001','pending'),
  ('33333333-0000-0000-0000-000000000003','44444444-0000-0000-0000-000000000001','pending'),
  ('33333333-0000-0000-0000-000000000004','44444444-0000-0000-0000-000000000001','pending'),
  ('33333333-0000-0000-0000-000000000005','44444444-0000-0000-0000-000000000001','pending'),
  ('33333333-0000-0000-0000-000000000006','44444444-0000-0000-0000-000000000001','pending')
ON CONFLICT (session_id, lead_id) DO NOTHING;

-- ============================================================
-- INSTRUCTIONS DE NETTOYAGE (à exécuter après les tests)
-- ============================================================
/*
DELETE FROM public.attendance   WHERE lead_id   = '44444444-0000-0000-0000-000000000001';
DELETE FROM public.cohort_enrollments WHERE lead_id = '44444444-0000-0000-0000-000000000001';
DELETE FROM public.leads        WHERE id = '44444444-0000-0000-0000-000000000001';
DELETE FROM public.cohort_sessions WHERE cohort_id = '22222222-0000-0000-0000-000000000001';
DELETE FROM public.cohorts      WHERE id = '22222222-0000-0000-0000-000000000001';
DELETE FROM public.formation_journeys WHERE id = '11111111-0000-0000-0000-000000000001';
*/
