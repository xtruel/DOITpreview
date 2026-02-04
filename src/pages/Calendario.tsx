import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const currentMonth = "Gennaio 2024";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  technician: string;
  location: string;
  color: "primary" | "info" | "warning" | "success";
}

interface DayData {
  day: number;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  events: CalendarEvent[];
}

const generateCalendarDays = (): DayData[] => {
  const days: DayData[] = [];
  
  // Previous month days
  for (let i = 29; i <= 31; i++) {
    days.push({ day: i, isCurrentMonth: false, events: [] });
  }
  
  // Current month days
  for (let i = 1; i <= 31; i++) {
    const events: CalendarEvent[] = [];
    
    if (i === 15) {
      events.push({
        id: "1",
        title: "Installazione caldaia",
        time: "09:00",
        technician: "Marco B.",
        location: "Via Roma 123",
        color: "primary",
      });
    }
    if (i === 15) {
      events.push({
        id: "2",
        title: "Manutenzione",
        time: "14:00",
        technician: "Luigi E.",
        location: "Via Milano 45",
        color: "info",
      });
    }
    if (i === 18) {
      events.push({
        id: "3",
        title: "Riparazione",
        time: "10:30",
        technician: "Marco B.",
        location: "Via Napoli 78",
        color: "warning",
      });
    }
    if (i === 22) {
      events.push({
        id: "4",
        title: "Sopralluogo",
        time: "11:00",
        technician: "Paolo R.",
        location: "Via Torino 12",
        color: "success",
      });
    }
    
    days.push({
      day: i,
      isToday: i === 15,
      isCurrentMonth: true,
      events,
    });
  }
  
  // Next month days
  for (let i = 1; i <= 4; i++) {
    days.push({ day: i, isCurrentMonth: false, events: [] });
  }
  
  return days;
};

const calendarDays = generateCalendarDays();

const todayEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Installazione caldaia",
    time: "09:00 - 12:00",
    technician: "Marco Bianchi",
    location: "Via Roma 123, Milano",
    color: "primary",
  },
  {
    id: "2",
    title: "Manutenzione condizionatore",
    time: "14:00 - 16:00",
    technician: "Luigi Esposito",
    location: "Via Milano 45, Milano",
    color: "info",
  },
  {
    id: "3",
    title: "Riparazione impianto",
    time: "16:30 - 18:00",
    technician: "Paolo Russo",
    location: "Via Napoli 78, Milano",
    color: "warning",
  },
];

const eventColors = {
  primary: "bg-primary text-primary-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  success: "bg-success text-success-foreground",
};

export default function Calendario() {
  return (
    <AppLayout title="Calendario" subtitle="Pianifica e gestisci gli appuntamenti">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>{currentMonth}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="iconSm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Oggi
                  </Button>
                  <Button variant="outline" size="iconSm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayData, index) => (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] p-2 rounded-lg border border-transparent transition-colors cursor-pointer hover:bg-accent/50",
                      !dayData.isCurrentMonth && "opacity-40",
                      dayData.isToday && "bg-primary/5 border-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                        dayData.isToday && "bg-primary text-primary-foreground"
                      )}
                    >
                      {dayData.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayData.events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate",
                            eventColors[event.color]
                          )}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayData.events.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1.5">
                          +{dayData.events.length - 2} altri
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Sidebar */}
        <div className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Oggi, 15 Gennaio</CardTitle>
                <Badge variant="inProgress">{todayEvents.length} eventi</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 bg-secondary/50",
                    event.color === "primary" && "border-l-primary",
                    event.color === "info" && "border-l-info",
                    event.color === "warning" && "border-l-warning",
                    event.color === "success" && "border-l-success"
                  )}
                >
                  <h5 className="font-medium text-sm mb-2">{event.title}</h5>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {event.technician}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="animate-fade-in p-4">
            <h5 className="font-medium text-sm mb-3">Legenda Tecnici</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Marco Bianchi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-info" />
                <span className="text-sm">Luigi Esposito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm">Paolo Russo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">Andrea Conti</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FAB */}
      <Button variant="fab" size="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
