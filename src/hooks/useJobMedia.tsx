import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export function useJobMedia(jobId: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Upload photo
  const uploadPhoto = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: 'before' | 'during' | 'after' }) => {
      if (!user) throw new Error('Utente non autenticato');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${category}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-files')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          file_url: urlData.publicUrl,
          category,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Foto caricata',
        description: 'La foto è stata salvata con successo.',
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

  // Upload signature
  const uploadSignature = useMutation({
    mutationFn: async ({ dataUrl, signerName }: { dataUrl: string; signerName?: string }) => {
      if (!user) throw new Error('Utente non autenticato');

      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const fileName = `${user.id}/${jobId}/signatures/${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-files')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('job_signatures')
        .insert({
          job_id: jobId,
          file_url: urlData.publicUrl,
          signer_name: signerName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Firma salvata',
        description: 'La firma del cliente è stata salvata.',
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

  // Upload voice note
  const uploadVoiceNote = useMutation({
    mutationFn: async ({ blob, duration }: { blob: Blob; duration: number }) => {
      if (!user) throw new Error('Utente non autenticato');

      const fileName = `${user.id}/${jobId}/voice-notes/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-files')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('job_voice_notes')
        .insert({
          job_id: jobId,
          file_url: urlData.publicUrl,
          duration_seconds: Math.round(duration),
          recorded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Nota vocale salvata',
        description: 'La registrazione è stata salvata.',
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

  // Manage checklist
  const updateChecklist = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('job_checklists')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? user.id : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const addChecklistItem = useMutation({
    mutationFn: async (item: string) => {
      const { data, error } = await supabase
        .from('job_checklists')
        .insert({
          job_id: jobId,
          item,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
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
    uploadPhoto,
    uploadSignature,
    uploadVoiceNote,
    updateChecklist,
    addChecklistItem,
  };
}
