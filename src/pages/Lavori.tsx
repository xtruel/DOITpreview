import { AppLayout } from "@/components/layout/AppLayout";
import { JobCard, JobStatus, Priority } from "@/components/dashboard/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, SlidersHorizontal } from "lucide-react";

interface Job {
  id: string;
  title: string;
  client: string;
  address: string;
  status: JobStatus;
  priority: Priority;
  time: string;
  technician: string;
}

const allJobs: Job[] = [
  {
    id: "JB-2024-089",
    title: "Installazione caldaia",
    client: "Mario Rossi",
    address: "Via Roma 123, Milano",
    status: "inProgress",
    priority: "high",
    time: "09:00 - 12:00",
    technician: "Marco Bianchi",
  },
  {
    id: "JB-2024-090",
    title: "Manutenzione condizionatore",
    client: "Laura Verdi",
    address: "Via Napoli 45, Milano",
    status: "scheduled",
    priority: "medium",
    time: "14:00 - 16:00",
    technician: "Luigi Esposito",
  },
  {
    id: "JB-2024-091",
    title: "Riparazione impianto elettrico",
    client: "Giuseppe Neri",
    address: "Via Torino 78, Milano",
    status: "paused",
    priority: "high",
    time: "10:30 - 13:00",
    technician: "Marco Bianchi",
  },
  {
    id: "JB-2024-092",
    title: "Sostituzione rubinetteria",
    client: "Anna Ferrari",
    address: "Via Firenze 22, Milano",
    status: "completed",
    priority: "low",
    time: "08:00 - 10:00",
    technician: "Paolo Russo",
  },
  {
    id: "JB-2024-093",
    title: "Installazione allarme",
    client: "Roberto Colombo",
    address: "Via Venezia 90, Milano",
    status: "toBill",
    priority: "medium",
    time: "15:00 - 18:00",
    technician: "Luigi Esposito",
  },
  {
    id: "JB-2024-094",
    title: "Manutenzione caldaia",
    client: "Francesca Gallo",
    address: "Via Bologna 34, Milano",
    status: "scheduled",
    priority: "low",
    time: "09:30 - 11:30",
    technician: "Paolo Russo",
  },
];

const statusFilters = [
  { value: "all", label: "Tutti", count: allJobs.length },
  {
    value: "inProgress",
    label: "In Corso",
    count: allJobs.filter((j) => j.status === "inProgress").length,
  },
  {
    value: "scheduled",
    label: "Schedulati",
    count: allJobs.filter((j) => j.status === "scheduled").length,
  },
  {
    value: "paused",
    label: "In Pausa",
    count: allJobs.filter((j) => j.status === "paused").length,
  },
  {
    value: "completed",
    label: "Completati",
    count: allJobs.filter((j) => j.status === "completed").length,
  },
  {
    value: "toBill",
    label: "Da Fatturare",
    count: allJobs.filter((j) => j.status === "toBill").length,
  },
];

export default function Lavori() {
  return (
    <AppLayout title="Lavori" subtitle="Gestisci tutti i tuoi lavori">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca lavoro per ID, cliente o indirizzo..."
            className="pl-9"
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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuovo Lavoro
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
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

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        </TabsContent>

        {statusFilters.slice(1).map((filter) => (
          <TabsContent key={filter.value} value={filter.value} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allJobs
                .filter((job) => job.status === filter.value)
                .map((job) => (
                  <JobCard key={job.id} {...job} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* FAB */}
      <Button variant="fab" size="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
