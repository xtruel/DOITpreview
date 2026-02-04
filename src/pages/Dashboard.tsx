import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, MapPin, Clock, User } from "lucide-react";
import { Briefcase, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { useClients } from "@/hooks/useClients";
import { useQuotes } from "@/hooks/useQuotes";

const statusColors: Record<string, string> = {
  scheduled: "bg-info/15 text-info",
  in_progress: "bg-primary/15 text-primary",
  paused: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  to_bill: "bg-muted text-muted-foreground",
  billed: "bg-secondary text-secondary-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { clients, isLoading: clientsLoading } = useClients();
  const { quotes, isLoading: quotesLoading } = useQuotes();

  const isLoading = jobsLoading || clientsLoading || quotesLoading;

  // Calculate stats
  const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'scheduled');
  const completedToday = jobs.filter(j => {
    if (!j.completed_at) return false;
    const today = new Date().toDateString();
    return new Date(j.completed_at).toDateString() === today;
  });
  const pendingJobs = jobs.filter(j => j.status === 'scheduled');
  const approvedQuotesValue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + Number(q.amount), 0);

  const stats = [
    {
      title: "Lavori Attivi",
      value: activeJobs.length,
      change: `${pendingJobs.length} in attesa`,
      changeType: "positive" as const,
      icon: Briefcase,
      iconColor: "primary" as const,
    },
    {
      title: "Completati Oggi",
      value: completedToday.length,
      change: "obiettivo: 5",
      changeType: "positive" as const,
      icon: CheckCircle,
      iconColor: "success" as const,
    },
    {
      title: "Clienti Totali",
      value: clients.length,
      change: "anagrafica",
      changeType: "positive" as const,
      icon: User,
      iconColor: "info" as const,
    },
    {
      title: "Preventivi Approvati",
      value: `€${approvedQuotesValue.toLocaleString('it-IT')}`,
      change: `${quotes.filter(q => q.status === 'approved').length} preventivi`,
      changeType: "positive" as const,
      icon: TrendingUp,
      iconColor: "success" as const,
    },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" subtitle="Benvenuto! Ecco la situazione di oggi.">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Benvenuto! Ecco la situazione di oggi.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lavori in Corso</h2>
            <Button size="sm" className="gap-2" onClick={() => navigate('/lavori')}>
              <Plus className="w-4 h-4" />
              Nuovo Lavoro
            </Button>
          </div>
          
          {activeJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nessun lavoro attivo al momento</p>
              <Button className="mt-4" onClick={() => navigate('/lavori')}>
                Crea il primo lavoro
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeJobs.slice(0, 4).map((job) => (
                <Card
                  key={job.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => navigate(`/lavori/${job.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          #{job.job_number}
                        </p>
                        <h4 className="font-semibold text-foreground">
                          {job.title}
                        </h4>
                      </div>
                      <Badge className={priorityColors[job.priority]}>
                        {job.priority === "high" ? "Alta" : job.priority === "urgent" ? "Urgente" : "Media"}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      {job.clients && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4 shrink-0" />
                          <span>{job.clients.name}</span>
                        </div>
                      )}
                      {job.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      )}
                      {job.scheduled_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            {new Date(job.scheduled_date).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Badge className={statusColors[job.status]}>
                      {job.status === "in_progress" ? "In Corso" : "Schedulato"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-4">
          {/* Recent Clients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ultimi Clienti</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun cliente</p>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Quotes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preventivi in Attesa</CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.filter(q => q.status === 'sent').length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun preventivo in attesa</p>
              ) : (
                <div className="space-y-3">
                  {quotes.filter(q => q.status === 'sent').slice(0, 3).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{quote.title}</p>
                        <p className="text-xs text-muted-foreground">{quote.clients?.name}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        €{Number(quote.amount).toLocaleString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAB */}
      <Button variant="fab" size="fab" onClick={() => navigate('/lavori')}>
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
