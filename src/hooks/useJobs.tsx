import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export type JobStatus = 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'to_bill' | 'billed';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Job {
  id: string;
  job_number: string;
  title: string;
  description: string | null;
  client_id: string;
  assigned_technician_id: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  address: string | null;
  notes: string | null;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  technician?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface CreateJobData {
  title: string;
  description?: string;
  client_id: string;
  assigned_technician_id?: string;
  priority?: JobPriority;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  address?: string;
  notes?: string;
}

export function useJobs(status?: JobStatus) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs', status],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          clients (name, phone, email)
        `)
        .order('scheduled_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Job[];
    },
    enabled: !!user,
  });

  const createJob = useMutation({
    mutationFn: async (jobData: CreateJobData) => {
      if (!user) throw new Error('Utente non autenticato');
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          title: jobData.title,
          description: jobData.description,
          client_id: jobData.client_id,
          assigned_technician_id: jobData.assigned_technician_id,
          priority: jobData.priority,
          scheduled_date: jobData.scheduled_date,
          scheduled_time_start: jobData.scheduled_time_start,
          scheduled_time_end: jobData.scheduled_time_end,
          address: jobData.address,
          notes: jobData.notes,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Lavoro creato',
        description: 'Il lavoro è stato aggiunto con successo.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...jobData }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Lavoro aggiornato',
        description: 'Le modifiche sono state salvate.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const updateJobStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      const updateData: Partial<Job> = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Lavoro eliminato',
        description: 'Il lavoro è stato rimosso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  return {
    jobs,
    isLoading,
    error,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
  };
}

export function useJob(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients (id, name, phone, email, address),
          technician:profiles!jobs_assigned_technician_id_fkey (first_name, last_name),
          job_checklists (*),
          job_photos (*),
          job_signatures (*),
          job_voice_notes (*),
          job_public_links (public_token, is_active)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}
