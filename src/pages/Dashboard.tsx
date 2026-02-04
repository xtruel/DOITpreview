import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobCard, JobStatus, Priority } from "@/components/dashboard/JobCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Lavori Attivi",
    value: 12,
    change: "+3 da ieri",
    changeType: "positive" as const,
    icon: Briefcase,
    iconColor: "primary" as const,
  },
  {
    title: "Completati Oggi",
    value: 5,
    change: "83% obiettivo",
    changeType: "positive" as const,
    icon: CheckCircle,
    iconColor: "success" as const,
  },
  {
    title: "In Attesa",
    value: 8,
    change: "2 urgenti",
    changeType: "negative" as const,
    icon: Clock,
    iconColor: "warning" as const,
  },
  {
    title: "Fatturato Mese",
    value: "€24.580",
    change: "+12% vs mese prec.",
    changeType: "positive" as const,
    icon: TrendingUp,
    iconColor: "info" as const,
  },
];

const activeJobs = [
  {
    id: "JB-2024-089",
    title: "Installazione caldaia",
    client: "Mario Rossi",
    address: "Via Roma 123, Milano",
    status: "inProgress" as JobStatus,
    priority: "high" as Priority,
    time: "09:00 - 12:00",
    technician: "Marco Bianchi",
  },
  {
    id: "JB-2024-090",
    title: "Manutenzione condizionatore",
    client: "Laura Verdi",
    address: "Via Napoli 45, Milano",
    status: "scheduled" as JobStatus,
    priority: "medium" as Priority,
    time: "14:00 - 16:00",
    technician: "Luigi Esposito",
  },
  {
    id: "JB-2024-091",
    title: "Riparazione impianto elettrico",
    client: "Giuseppe Neri",
    address: "Via Torino 78, Milano",
    status: "paused" as JobStatus,
    priority: "high" as Priority,
    time: "10:30 - 13:00",
    technician: "Marco Bianchi",
  },
];

export default function Dashboard() {
  return (
    <AppLayout
      title="Dashboard"
      subtitle="Benvenuto! Ecco la situazione di oggi."
    >
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
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nuovo Lavoro
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-4">
          <QuickActions />
          <TodaySchedule />
          <RecentClients />
        </div>
      </div>

      {/* FAB */}
      <Button variant="fab" size="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
