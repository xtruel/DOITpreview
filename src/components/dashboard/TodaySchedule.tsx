import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  status: "scheduled" | "inProgress" | "completed";
}

const scheduleData: ScheduleItem[] = [
  {
    id: "1",
    time: "09:00",
    title: "Riparazione caldaia",
    location: "Via Roma 123",
    status: "completed",
  },
  {
    id: "2",
    time: "11:30",
    title: "Installazione condizionatore",
    location: "Via Milano 45",
    status: "inProgress",
  },
  {
    id: "3",
    time: "14:00",
    title: "Manutenzione impianto",
    location: "Via Napoli 78",
    status: "scheduled",
  },
  {
    id: "4",
    time: "16:30",
    title: "Sopralluogo preventivo",
    location: "Via Torino 12",
    status: "scheduled",
  },
];

const statusLabels = {
  scheduled: "Schedulato",
  inProgress: "In corso",
  completed: "Completato",
};

export function TodaySchedule() {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Oggi</CardTitle>
          <span className="text-sm text-muted-foreground">4 appuntamenti</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scheduleData.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-foreground">
                {item.time}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h5 className="font-medium text-sm truncate">{item.title}</h5>
                <Badge variant={item.status} className="shrink-0">
                  {statusLabels[item.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{item.location}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
