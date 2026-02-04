-- Fix security definer view: recreate with security_invoker
DROP VIEW IF EXISTS public.public_job_status;

CREATE VIEW public.public_job_status 
WITH (security_invoker = on)
AS
SELECT 
  jpl.public_token,
  j.job_number,
  j.title,
  j.status,
  j.scheduled_date,
  j.completed_at,
  c.name AS client_name,
  p.first_name || ' ' || p.last_name AS technician_name,
  (SELECT COUNT(*) FROM public.job_checklists jc WHERE jc.job_id = j.id) AS total_checklist_items,
  (SELECT COUNT(*) FROM public.job_checklists jc WHERE jc.job_id = j.id AND jc.completed = true) AS completed_checklist_items,
  (SELECT COUNT(*) FROM public.job_photos jp WHERE jp.job_id = j.id) AS photo_count
FROM public.job_public_links jpl
JOIN public.jobs j ON j.id = jpl.job_id
JOIN public.clients c ON c.id = j.client_id
LEFT JOIN public.profiles p ON p.user_id = j.assigned_technician_id
WHERE jpl.is_active = true;

-- Fix function search_path for handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix function search_path for generate_job_number
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.jobs
  WHERE job_number LIKE 'JB-' || year_str || '-%';
  
  NEW.job_number := 'JB-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

-- Fix function search_path for generate_quote_number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.quotes
  WHERE quote_number LIKE 'PRV-' || year_str || '-%';
  
  NEW.quote_number := 'PRV-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

-- Funzione RPC per ottenere stato lavoro pubblico (senza autenticazione)
CREATE OR REPLACE FUNCTION public.get_public_job_status(p_token TEXT)
RETURNS TABLE (
  job_number TEXT,
  title TEXT,
  status job_status,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  client_name TEXT,
  technician_name TEXT,
  total_checklist_items BIGINT,
  completed_checklist_items BIGINT,
  photo_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.job_number,
    j.title,
    j.status,
    j.scheduled_date,
    j.completed_at,
    c.name AS client_name,
    p.first_name || ' ' || p.last_name AS technician_name,
    (SELECT COUNT(*) FROM public.job_checklists jc WHERE jc.job_id = j.id) AS total_checklist_items,
    (SELECT COUNT(*) FROM public.job_checklists jc WHERE jc.job_id = j.id AND jc.completed = true) AS completed_checklist_items,
    (SELECT COUNT(*) FROM public.job_photos jp WHERE jp.job_id = j.id) AS photo_count
  FROM public.job_public_links jpl
  JOIN public.jobs j ON j.id = jpl.job_id
  JOIN public.clients c ON c.id = j.client_id
  LEFT JOIN public.profiles p ON p.user_id = j.assigned_technician_id
  WHERE jpl.public_token = p_token AND jpl.is_active = true
  LIMIT 1;
$$;