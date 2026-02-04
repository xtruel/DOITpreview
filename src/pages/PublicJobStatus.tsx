import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PublicJobData {
  job_number: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  client_name: string;
  technician_name: string | null;
  total_checklist_items: number;
  completed_checklist_items: number;
  photo_count: number;
}

const statusLabels: Record<string, string> = {
  scheduled: "Programmato",
  in_progress: "In Corso",
  paused: "In Pausa",
  completed: "Completato",
  to_bill: "Completato",
  billed: "Completato",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-info/20 text-info",
  in_progress: "bg-primary/20 text-primary",
  paused: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  to_bill: "bg-success/20 text-success",
  billed: "bg-success/20 text-success",
};

export default function PublicJobStatus() {
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<PublicJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobStatus() {
      if (!token) {
        setError("Link non valido");
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_public_job_status', { p_token: token });

        if (rpcError) throw rpcError;

        if (!data || data.length === 0) {
          setError("Lavoro non trovato o link scaduto");
        } else {
          setJob(data[0]);
        }
      } catch (err) {
        console.error("Error fetching job status:", err);
        setError("Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    }

    fetchJobStatus();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Errore</h2>
          <p className="text-muted-foreground">{error || "Lavoro non trovato"}</p>
        </Card>
      </div>
    );
  }

  const progress = job.total_checklist_items > 0
    ? Math.round((job.completed_checklist_items / job.total_checklist_items) * 100)
    : job.status === "completed" || job.status === "to_bill" || job.status === "billed"
    ? 100
    : job.status === "in_progress"
    ? 50
    : 0;

  const isCompleted = job.status === "completed" || job.status === "to_bill" || job.status === "billed";

  const steps = [
    { id: 1, label: "Schedulato", completed: true },
    { id: 2, label: "In corso", completed: job.status !== "scheduled", current: job.status === "in_progress" || job.status === "paused" },
    { id: 3, label: "Completato", completed: isCompleted },
    { id: 4, label: "Documentato", completed: isCompleted && job.photo_count > 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">DOIT</h1>
                <p className="text-xs text-muted-foreground">
                  Lavoro #{job.job_number}
                </p>
              </div>
            </div>
            <Badge className={statusColors[job.status] || statusColors.scheduled}>
              {statusLabels[job.status] || job.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <span className="text-3xl font-bold text-primary">
                  {progress}%
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {job.title}
              </h2>
              <p className="text-muted-foreground">
                {isCompleted ? "Lavoro completato" : "Il tuo lavoro è in corso"}
              </p>
            </div>

            <Progress value={progress} className="h-3 mb-6" />

            {/* Steps */}
            <div className="flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all",
                      step.completed
                        ? "bg-primary text-primary-foreground"
                        : step.current
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-center",
                      step.current ? "font-medium text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dettagli Lavoro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{job.client_name}</p>
                <p className="text-xs text-muted-foreground">Cliente</p>
              </div>
            </div>

            {job.scheduled_date && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {new Date(job.scheduled_date).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Data programmata</p>
                </div>
              </div>
            )}

            {job.technician_name && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{job.technician_name}</p>
                  <p className="text-xs text-muted-foreground">Tecnico assegnato</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                <CheckCircle className="w-5 h-5" />
                {job.completed_checklist_items}/{job.total_checklist_items}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Attività completate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                <Camera className="w-5 h-5" />
                {job.photo_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Foto caricate</p>
            </CardContent>
          </Card>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Lavoro Completato!</h3>
              <p className="text-sm text-muted-foreground">
                Il lavoro è stato portato a termine con successo. Grazie per aver scelto i nostri servizi.
              </p>
              {job.completed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Completato il {new Date(job.completed_at).toLocaleDateString("it-IT")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagina sicura e protetta</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">DOIT</span>
          </p>
        </div>
      </main>
    </div>
  );
}
