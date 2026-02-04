import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Calendar,
  Camera,
  FileText,
  Phone,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for public view
const publicJobData = {
  id: "JB-2024-089",
  title: "Installazione caldaia",
  company: {
    name: "DOIT Services",
    logo: null,
    phone: "+39 02 1234567",
  },
  client: "Mario Rossi",
  address: "Via Roma 123, Milano",
  status: "inProgress" as const,
  progress: 65,
  scheduledDate: "4 Febbraio 2026",
  scheduledTime: "09:00 - 12:00",
  technician: "Marco Bianchi",
  updates: [
    {
      id: 1,
      timestamp: "09:15",
      title: "Lavoro iniziato",
      description: "Il tecnico è arrivato sul posto",
      type: "status",
    },
    {
      id: 2,
      timestamp: "09:30",
      title: "Foto prima dell'intervento",
      description: "Documentazione stato iniziale",
      type: "photo",
      photos: ["/placeholder.svg", "/placeholder.svg"],
    },
    {
      id: 3,
      timestamp: "10:45",
      title: "Rimozione vecchia caldaia",
      description: "Completata rimozione impianto esistente",
      type: "progress",
    },
    {
      id: 4,
      timestamp: "11:30",
      title: "Installazione in corso",
      description: "Montaggio nuova caldaia a condensazione",
      type: "progress",
    },
  ],
  steps: [
    { id: 1, label: "Schedulato", completed: true },
    { id: 2, label: "In corso", completed: true, current: true },
    { id: 3, label: "Completato", completed: false },
    { id: 4, label: "Documentato", completed: false },
  ],
};

const statusColors = {
  scheduled: "bg-info/20 text-info",
  inProgress: "bg-primary/20 text-primary",
  paused: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  toBill: "bg-secondary text-secondary-foreground",
};

const statusLabels = {
  scheduled: "Schedulato",
  inProgress: "In Corso",
  paused: "In Pausa",
  completed: "Completato",
  toBill: "Completato",
};

export default function PublicJobStatus() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  {publicJobData.company.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Lavoro #{publicJobData.id}
                </p>
              </div>
            </div>
            <Badge className={statusColors[publicJobData.status]}>
              {statusLabels[publicJobData.status]}
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
                  {publicJobData.progress}%
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {publicJobData.title}
              </h2>
              <p className="text-muted-foreground">
                Il tuo lavoro è in corso
              </p>
            </div>

            <Progress value={publicJobData.progress} className="h-3 mb-6" />

            {/* Steps */}
            <div className="flex justify-between">
              {publicJobData.steps.map((step, index) => (
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
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{publicJobData.scheduledDate}</p>
                <p className="text-xs text-muted-foreground">{publicJobData.scheduledTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{publicJobData.address}</p>
                <p className="text-xs text-muted-foreground">Indirizzo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{publicJobData.technician}</p>
                <p className="text-xs text-muted-foreground">Tecnico assegnato</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aggiornamenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publicJobData.updates.map((update, index) => (
                <div key={update.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        update.type === "photo"
                          ? "bg-info/20 text-info"
                          : update.type === "status"
                          ? "bg-success/20 text-success"
                          : "bg-primary/20 text-primary"
                      )}
                    >
                      {update.type === "photo" ? (
                        <Camera className="w-4 h-4" />
                      ) : update.type === "status" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    {index < publicJobData.updates.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{update.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {update.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {update.description}
                    </p>

                    {update.photos && (
                      <div className="flex gap-2 mt-3">
                        {update.photos.map((photo, i) => (
                          <div
                            key={i}
                            className="w-20 h-20 rounded-lg bg-secondary overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Hai domande?</p>
                  <p className="text-xs text-muted-foreground">
                    Contattaci per assistenza
                  </p>
                </div>
              </div>
              <a
                href={`tel:${publicJobData.company.phone}`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Chiama
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagina sicura e protetta</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">APP DOIT</span>
          </p>
        </div>
      </main>
    </div>
  );
}
