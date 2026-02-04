import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

const DEMO = true; // Forced for preview deployment

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
      if (DEMO) {
        const demoJobs: Job[] = [
          {
            id: 'j1',
            job_number: 'JB-2024-089',
            title: 'Boiler Installation',
            description: 'System replacement and final testing',
            client_id: 'c1',
            assigned_technician_id: 't1',
            status: 'in_progress',
            priority: 'high',
            scheduled_date: new Date().toISOString(),
            scheduled_time_start: '09:00',
            scheduled_time_end: '12:00',
            address: '123 Rome St, Milan',
            notes: 'Bring gasket kit',
            completion_notes: null,
            completed_at: null,
            created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            clients: { name: 'Mario Rossi', phone: '3331234567', email: 'mario@rossi.it' },
            technician: { first_name: 'Mark', last_name: 'White' },
          },
          {
            id: 'j2',
            job_number: 'JB-2024-090',
            title: 'System Maintenance',
            description: 'Safety check and filter cleaning',
            client_id: 'c2',
            assigned_technician_id: 't1',
            status: 'scheduled',
            priority: 'medium',
            scheduled_date: new Date(Date.now() + 86400000).toISOString(),
            scheduled_time_start: '14:00',
            scheduled_time_end: '16:00',
            address: '22 Italy Ave, Turin',
            notes: null,
            completion_notes: null,
            completed_at: null,
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            clients: { name: 'Laura Bianchi', phone: '3339876543', email: 'laura@bianchi.it' },
            technician: { first_name: 'Mark', last_name: 'White' },
          },
          {
            id: 'j3',
            job_number: 'JB-2024-091',
            title: 'Leak Repair',
            description: 'Urgent intervention main bathroom',
            client_id: 'c1',
            assigned_technician_id: 't2',
            status: 'completed',
            priority: 'urgent',
            scheduled_date: new Date(Date.now() - 2 * 86400000).toISOString(),
            scheduled_time_start: '10:30',
            scheduled_time_end: '11:30',
            address: '123 Rome St, Milan',
            notes: 'Before/after photos required',
            completion_notes: 'Intervention completed successfully',
            completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            clients: { name: 'Mario Rossi', phone: '3331234567', email: 'mario@rossi.it' },
            technician: { first_name: 'Luke', last_name: 'Green' },
          },
          {
            id: 'j4',
            job_number: 'JB-2024-092',
            title: 'Air Conditioning Service',
            description: 'Annual maintenance and gas check',
            client_id: 'c3',
            assigned_technician_id: 't3',
            status: 'scheduled',
            priority: 'low',
            scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString(),
            scheduled_time_start: '09:00',
            scheduled_time_end: '11:00',
            address: '45 Park Lane, Rome',
            notes: 'Check external unit noise',
            completion_notes: null,
            completed_at: null,
            created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            clients: { name: 'Giuseppe Verdi', phone: '3335557777', email: 'g.verdi@email.it' },
            technician: { first_name: 'John', last_name: 'Smith' },
          },
          {
            id: 'j5',
            job_number: 'JB-2024-093',
            title: 'Electrical Wiring Inspection',
            description: 'Full house wiring safety check',
            client_id: 'c2',
            assigned_technician_id: 't1',
            status: 'to_bill',
            priority: 'medium',
            scheduled_date: new Date(Date.now() - 3 * 86400000).toISOString(),
            scheduled_time_start: '13:00',
            scheduled_time_end: '17:00',
            address: '22 Italy Ave, Turin',
            notes: null,
            completion_notes: 'All checks passed, minor adjustments made',
            completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            clients: { name: 'Laura Bianchi', phone: '3339876543', email: 'laura@bianchi.it' },
            technician: { first_name: 'Mark', last_name: 'White' },
          }
        ];
        return status ? demoJobs.filter((j) => j.status === status) : demoJobs;
      }
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
      
      if (DEMO) {
        return { id: 'demo-job', ...jobData } as unknown as Job;
      }
      const newJobPayload: CreateJobData & { created_by: string } = {
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
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert(newJobPayload)
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
      if (DEMO) {
        return { id, ...jobData } as unknown as Job;
      }
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
      if (DEMO) {
        return { id, status } as unknown as Job;
      }
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
      if (DEMO) return;
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
      if (DEMO) {
        return {
          id,
          job_number: 'JB-2024-089',
          title: 'Installazione caldaia',
          description: 'Sostituzione impianto e collaudo finale',
          client_id: 'c1',
          assigned_technician_id: 't1',
          status: 'in_progress',
          priority: 'high',
          scheduled_date: new Date().toISOString(),
          scheduled_time_start: '09:00',
          scheduled_time_end: '12:00',
          address: 'Via Roma 123, Milano',
          notes: 'Portare kit guarnizioni',
          completion_notes: null,
          completed_at: null,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          clients: { id: 'c1', name: 'Mario Rossi', phone: '3331234567', email: 'mario@rossi.it', address: 'Via Roma 123, Milano' },
          technician: { first_name: 'Marco', last_name: 'Bianchi' },
          job_checklists: [
            { id: 'cl1', title: 'Verifica impianto', is_completed: true },
            { id: 'cl2', title: 'Installazione unità', is_completed: false },
          ],
          job_photos: [
            { id: 'ph1', file_url: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=800&auto=format&fit=crop' },
          ],
          job_signatures: [
            { id: 'sg1', file_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop', signer_name: 'Mario Rossi' },
          ],
          job_voice_notes: [],
          job_public_links: [{ public_token: 'demo-token', is_active: true }],
        };
      }
      
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
