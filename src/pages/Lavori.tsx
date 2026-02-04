import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Loader2,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { useJobs, JobStatus, CreateJobData } from "@/hooks/useJobs";
import { useClients } from "@/hooks/useClients";

const statusLabels: Record<JobStatus, string> = {
  scheduled: "Schedulato",
  in_progress: "In Corso",
  paused: "In Pausa",
  completed: "Completato",
  to_bill: "Da Fatturare",
  billed: "Fatturato",
};

const statusColors: Record<JobStatus, string> = {
  scheduled: "bg-info/15 text-info",
  in_progress: "bg-primary/15 text-primary",
  paused: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  to_bill: "bg-muted text-muted-foreground",
  billed: "bg-secondary text-secondary-foreground",
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export default function Lavori() {
  const navigate = useNavigate();
  const { jobs, isLoading, createJob } = useJobs();
  const { clients } = useClients();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateJobData>({
    title: "",
    description: "",
    client_id: "",
    priority: "medium",
    scheduled_date: "",
    address: "",
    notes: "",
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_number.toLowerCase().includes(search.toLowerCase()) ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.clients?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "all" || job.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const statusFilters = [
    { value: "all", label: "Tutti", count: jobs.length },
    { value: "in_progress", label: "In Corso", count: jobs.filter((j) => j.status === "in_progress").length },
    { value: "scheduled", label: "Schedulati", count: jobs.filter((j) => j.status === "scheduled").length },
    { value: "paused", label: "In Pausa", count: jobs.filter((j) => j.status === "paused").length },
    { value: "completed", label: "Completati", count: jobs.filter((j) => j.status === "completed").length },
    { value: "to_bill", label: "Da Fatturare", count: jobs.filter((j) => j.status === "to_bill").length },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createJob.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({ title: "", description: "", client_id: "", priority: "medium", scheduled_date: "", address: "", notes: "" });
  };

  if (isLoading) {
    return (
      <AppLayout title="Lavori" subtitle="Gestisci tutti i tuoi lavori">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Lavori" subtitle="Gestisci tutti i tuoi lavori">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca lavoro per ID, cliente o indirizzo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Ordina
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtri
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuovo Lavoro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuovo Lavoro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorità</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Bassa</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createJob.isPending || !formData.client_id}>
                  {createJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crea Lavoro
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-secondary/50 rounded-lg overflow-x-auto flex-nowrap">
          {statusFilters.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="data-[state=active]:bg-card data-[state=active]:shadow-soft px-4 py-2 rounded-md whitespace-nowrap"
            >
              {filter.label}
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {filter.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {search ? "Nessun lavoro trovato" : "Nessun lavoro presente. Crea il primo!"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  hover
                  className="animate-slide-up cursor-pointer"
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
                      <div className="flex gap-2">
                        <Badge className={priorityColors[job.priority]}>
                          {job.priority === "high" ? "Alta" : job.priority === "urgent" ? "Urgente" : job.priority === "medium" ? "Media" : "Bassa"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
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
                            {job.scheduled_time_start && ` • ${job.scheduled_time_start}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Badge className={statusColors[job.status]}>
                        {statusLabels[job.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Tabs>

      {/* FAB */}
      <Button variant="fab" size="fab" onClick={() => setIsDialogOpen(true)}>
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
