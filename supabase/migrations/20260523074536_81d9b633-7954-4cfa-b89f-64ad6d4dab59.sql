-- Fix search_path sur get_cohort_enrolled_count
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