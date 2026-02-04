-- Enum per ruoli utente
CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'client');

-- Enum per stati lavoro
CREATE TYPE public.job_status AS ENUM ('scheduled', 'in_progress', 'paused', 'completed', 'to_bill', 'billed');

-- Enum per stati preventivo
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'converted');

-- Enum per priorità
CREATE TYPE public.job_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tabella ruoli utente (separata per sicurezza)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabella profili utente
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella clienti
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella lavori
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_technician_id UUID REFERENCES auth.users(id),
  status job_status NOT NULL DEFAULT 'scheduled',
  priority job_priority NOT NULL DEFAULT 'medium',
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  address TEXT,
  notes TEXT,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella checklist lavori
CREATE TABLE public.job_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella foto lavori
CREATE TABLE public.job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'during', -- 'before', 'during', 'after'
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella firme cliente
CREATE TABLE public.job_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  signer_name TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella note vocali
CREATE TABLE public.job_voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella preventivi
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status quote_status NOT NULL DEFAULT 'draft',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella voci preventivo
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella link pubblici per stato lavoro
CREATE TABLE public.job_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funzione helper per verificare ruolo (security definer per evitare ricorsione RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Funzione helper per verificare se utente è admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Funzione helper per verificare se utente è tecnico
CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'technician')
$$;

-- Funzione per ottenere l'id del profilo corrente
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Funzione per verificare accesso al lavoro
CREATE OR REPLACE FUNCTION public.can_access_job(_job_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE id = _job_id AND (
        created_by = auth.uid() OR 
        assigned_technician_id = auth.uid()
      )
    )
$$;

-- Trigger per creare profilo automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Assegna ruolo client di default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Funzione per generare numero lavoro
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER set_job_number
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  WHEN (NEW.job_number IS NULL OR NEW.job_number = '')
  EXECUTE FUNCTION public.generate_job_number();

-- Funzione per generare numero preventivo
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
  EXECUTE FUNCTION public.generate_quote_number();

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_public_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies per user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- RLS Policies per profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies per clients
CREATE POLICY "Admins and technicians can view all clients" ON public.clients FOR SELECT USING (public.is_admin() OR public.is_technician());
CREATE POLICY "Admins and technicians can insert clients" ON public.clients FOR INSERT WITH CHECK (public.is_admin() OR public.is_technician());
CREATE POLICY "Admins and technicians can update clients" ON public.clients FOR UPDATE USING (public.is_admin() OR public.is_technician());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (public.is_admin());

-- RLS Policies per jobs
CREATE POLICY "View jobs" ON public.jobs FOR SELECT USING (
  public.is_admin() OR 
  created_by = auth.uid() OR 
  assigned_technician_id = auth.uid()
);
CREATE POLICY "Insert jobs" ON public.jobs FOR INSERT WITH CHECK (public.is_admin() OR public.is_technician());
CREATE POLICY "Update jobs" ON public.jobs FOR UPDATE USING (public.can_access_job(id));
CREATE POLICY "Delete jobs" ON public.jobs FOR DELETE USING (public.is_admin());

-- RLS Policies per job_checklists
CREATE POLICY "View checklists" ON public.job_checklists FOR SELECT USING (public.can_access_job(job_id));
CREATE POLICY "Manage checklists" ON public.job_checklists FOR ALL USING (public.can_access_job(job_id));

-- RLS Policies per job_photos
CREATE POLICY "View photos" ON public.job_photos FOR SELECT USING (public.can_access_job(job_id));
CREATE POLICY "Manage photos" ON public.job_photos FOR ALL USING (public.can_access_job(job_id));

-- RLS Policies per job_signatures
CREATE POLICY "View signatures" ON public.job_signatures FOR SELECT USING (public.can_access_job(job_id));
CREATE POLICY "Manage signatures" ON public.job_signatures FOR ALL USING (public.can_access_job(job_id));

-- RLS Policies per job_voice_notes
CREATE POLICY "View voice notes" ON public.job_voice_notes FOR SELECT USING (public.can_access_job(job_id));
CREATE POLICY "Manage voice notes" ON public.job_voice_notes FOR ALL USING (public.can_access_job(job_id));

-- RLS Policies per quotes
CREATE POLICY "View quotes" ON public.quotes FOR SELECT USING (public.is_admin() OR public.is_technician() OR created_by = auth.uid());
CREATE POLICY "Insert quotes" ON public.quotes FOR INSERT WITH CHECK (public.is_admin() OR public.is_technician());
CREATE POLICY "Update quotes" ON public.quotes FOR UPDATE USING (public.is_admin() OR public.is_technician() OR created_by = auth.uid());
CREATE POLICY "Delete quotes" ON public.quotes FOR DELETE USING (public.is_admin());

-- RLS Policies per quote_items
CREATE POLICY "View quote items" ON public.quote_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (public.is_admin() OR public.is_technician() OR q.created_by = auth.uid()))
);
CREATE POLICY "Manage quote items" ON public.quote_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (public.is_admin() OR public.is_technician()))
);

-- RLS Policies per job_public_links (accesso pubblico in lettura tramite token)
CREATE POLICY "View own public links" ON public.job_public_links FOR SELECT USING (public.can_access_job(job_id));
CREATE POLICY "Manage public links" ON public.job_public_links FOR ALL USING (public.can_access_job(job_id));

-- Vista pubblica per stato lavoro (senza dati sensibili)
CREATE OR REPLACE VIEW public.public_job_status AS
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

-- Storage bucket per file
INSERT INTO storage.buckets (id, name, public) VALUES ('job-files', 'job-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload job files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-files' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view job files"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-files');

CREATE POLICY "Users can delete own uploaded files"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-files' AND auth.uid()::text = (storage.foldername(name))[1]);