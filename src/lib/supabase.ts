// Même projet Supabase que formateur-connect (base partagée)
import { supabase as _supabase } from '@/integrations/supabase/client';
// Cast to any to bypass strict typed schema (custom tables not in generated types)
export const supabase: any = _supabase;
