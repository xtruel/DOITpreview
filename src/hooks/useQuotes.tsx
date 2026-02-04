import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

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
      
      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          title: quoteData.title,
          description: quoteData.description,
          client_id: quoteData.client_id,
          amount: quoteData.amount,
          expiry_date: quoteData.expiry_date,
          created_by: user.id,
        } as any)
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
