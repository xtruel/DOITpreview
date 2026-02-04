import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

const DEMO = true; // Forced for preview deployment

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface Quote {
  id: string;
  quote_number: string;
  title: string;
  description: string | null;
  client_id: string;
  job_id: string | null;
  status: QuoteStatus;
  amount: number;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: {
    name: string;
    email: string | null;
  };
  quote_items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

export interface CreateQuoteData {
  title: string;
  description?: string;
  client_id: string;
  amount?: number;
  expiry_date?: string;
  items?: Omit<QuoteItem, 'id' | 'quote_id'>[];
}

export function useQuotes(status?: QuoteStatus) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ['quotes', status],
    queryFn: async () => {
      if (DEMO) {
        const demoQuotes: Quote[] = [
          {
            id: 'q1',
            quote_number: 'QT-2024-018',
            title: 'System Maintenance',
            description: 'Routine maintenance and safety check',
            client_id: 'c1',
            job_id: null,
            status: 'sent',
            amount: 420,
            expiry_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            clients: { name: 'Mario Rossi', email: 'mario@rossi.it' },
            quote_items: [
              { id: 'qi1', quote_id: 'q1', description: 'Technician Visit', quantity: 1, unit_price: 80, sort_order: 0 },
              { id: 'qi2', quote_id: 'q1', description: 'Spare Parts', quantity: 1, unit_price: 120, sort_order: 1 },
              { id: 'qi3', quote_id: 'q1', description: 'Labor', quantity: 2, unit_price: 110, sort_order: 2 },
            ],
          },
          {
            id: 'q2',
            quote_number: 'QT-2024-019',
            title: 'Air Conditioner Installation',
            description: 'Split unit installation 12000 BTU',
            client_id: 'c2',
            job_id: null,
            status: 'draft',
            amount: 980,
            expiry_date: new Date(Date.now() + 10 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            clients: { name: 'Laura Bianchi', email: 'laura@bianchi.it' },
            quote_items: [
              { id: 'qi4', quote_id: 'q2', description: 'Split Unit', quantity: 1, unit_price: 620, sort_order: 0 },
              { id: 'qi5', quote_id: 'q2', description: 'Installation', quantity: 1, unit_price: 360, sort_order: 1 },
            ],
          },
          {
            id: 'q3',
            quote_number: 'QT-2024-020',
            title: 'Office Rewiring',
            description: 'Complete rewiring of the main meeting room',
            client_id: 'c3',
            job_id: null,
            status: 'approved',
            amount: 1500,
            expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            clients: { name: 'Giuseppe Verdi', email: 'g.verdi@email.it' },
            quote_items: [
              { id: 'qi6', quote_id: 'q3', description: 'Materials', quantity: 1, unit_price: 500, sort_order: 0 },
              { id: 'qi7', quote_id: 'q3', description: 'Labor', quantity: 10, unit_price: 100, sort_order: 1 },
            ],
          },
        ];
        return status ? demoQuotes.filter((q) => q.status === status) : demoQuotes;
      }
      let query = supabase
        .from('quotes')
        .select(`
          *,
          clients (name, email),
          quote_items (*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!user,
  });

  const createQuote = useMutation({
    mutationFn: async ({ items, ...quoteData }: CreateQuoteData) => {
      if (!user) throw new Error('Utente non autenticato');
      
      if (DEMO) {
        return { id: 'demo-quote', ...quoteData } as unknown as Quote;
      }
      // Create quote
      const newQuotePayload: CreateQuoteData & { created_by: string } = {
        title: quoteData.title,
        description: quoteData.description,
        client_id: quoteData.client_id,
        amount: quoteData.amount,
        expiry_date: quoteData.expiry_date,
        created_by: user.id,
      };

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(newQuotePayload)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(
            items.map((item, index) => ({
              ...item,
              quote_id: quote.id,
              sort_order: index,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Preventivo creato',
        description: 'Il preventivo è stato aggiunto con successo.',
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

  const updateQuote = useMutation({
    mutationFn: async ({ id, ...quoteData }: Partial<Quote> & { id: string }) => {
      if (DEMO) {
        return { id, ...quoteData } as unknown as Quote;
      }
      const { data, error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Preventivo aggiornato',
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

  const updateQuoteStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      if (DEMO) {
        return { id, status } as unknown as Quote;
      }
      const { data, error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      if (DEMO) return;
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Preventivo eliminato',
        description: 'Il preventivo è stato rimosso.',
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
    quotes,
    isLoading,
    error,
    createQuote,
    updateQuote,
    updateQuoteStatus,
    deleteQuote,
  };
}
