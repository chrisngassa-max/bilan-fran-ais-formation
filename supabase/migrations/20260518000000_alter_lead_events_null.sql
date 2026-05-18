ALTER TABLE public.lead_events ALTER COLUMN lead_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_events_event_name ON public.lead_events(event_name);
