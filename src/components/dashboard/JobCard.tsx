import { Clock, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type JobStatus =
  | "scheduled"
  | "inProgress"
  | "paused"
  | "completed"
  | "toBill";

export type Priority = "low" | "medium" | "high";

interface JobCardProps {
  id: string;
  title: string;
  client: string;
  address: string;
  status: JobStatus;
  priority: Priority;
  time: string;
  technician: string;
  onClick?: () => void;
}

const statusLabels: Record<JobStatus, string> = {
  scheduled: "Schedulato",
  inProgress: "In corso",
  paused: "In pausa",
  completed: "Completato",
  toBill: "Da fatturare",
};

const priorityLabels: Record<Priority, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
};

export function JobCard({
  id,
  title,
  client,
  address,
  status,
  priority,
  time,
  technician,
  onClick,
}: JobCardProps) {
  return (
    <Card
      hover
      onClick={onClick}
      className={cn(
        "p-4 animate-slide-up",
        status === "inProgress" && "border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            #{id}
          </p>
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <div className="flex gap-2">
          <Badge variant={priority}>{priorityLabels[priority]}</Badge>
          <Badge variant={status}>{statusLabels[status]}</Badge>
        </div>
      </div>

      <p className="text-sm font-medium text-foreground mb-2">{client}</p>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          <span>{technician}</span>
        </div>
      </div>
    </Card>
  );
}
