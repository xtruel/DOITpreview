import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

const DEMO = true; // Forced for preview deployment

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

export function useClients() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (DEMO) {
        return [
          { id: 'c1', name: 'Mario Rossi', company: 'Rossi Service', email: 'mario@rossi.it', phone: '3331234567', address: '123 Rome St, Milan', notes: 'Historical client', tags: ['VIP'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'c2', name: 'Laura Bianchi', company: null, email: 'laura@bianchi.it', phone: '3339876543', address: '22 Italy Ave, Turin', notes: null, tags: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'c3', name: 'Giuseppe Verdi', company: 'Verdi Music Hall', email: 'g.verdi@email.it', phone: '3335557777', address: '45 Park Lane, Rome', notes: 'Requires early appointments', tags: ['Business'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'c4', name: 'Sofia Neri', company: 'Neri Design', email: 'sofia@neri.it', phone: '3334448888', address: '88 Fashion Blvd, Milan', notes: null, tags: ['New'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ] as Client[];
      }
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const createClient = useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      if (!user) throw new Error('Utente non autenticato');
      
      if (DEMO) {
        return { id: 'demo', ...clientData } as unknown as Client;
      }
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente creato',
        description: 'Il cliente è stato aggiunto con successo.',
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

  const updateClient = useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<Client> & { id: string }) => {
      if (DEMO) {
        return { id, ...clientData } as unknown as Client;
      }
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente aggiornato',
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

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      if (DEMO) return;
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente eliminato',
        description: 'Il cliente è stato rimosso.',
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
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
}
