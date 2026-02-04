import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PhotoUpload } from "@/components/jobs/PhotoUpload";
import { SignaturePad } from "@/components/jobs/SignaturePad";
import { JobChecklist } from "@/components/jobs/JobChecklist";
import { VoiceNotes } from "@/components/jobs/VoiceNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Navigation,
  Play,
  Pause,
  CheckCircle,
  FileText,
  Share2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock job data
const jobData = {
  id: "JB-2024-089",
  title: "Installazione caldaia",
  client: {
    name: "Mario Rossi",
    phone: "+39 333 1234567",
    email: "mario.rossi@email.it",
  },
  address: "Via Roma 123, 20121 Milano",
  status: "inProgress" as const,
  priority: "high" as const,
  time: "09:00 - 12:00",
  date: "Oggi",
  technician: "Marco Bianchi",
  description:
    "Installazione nuova caldaia a condensazione con sostituzione vecchio impianto. Necessario verificare impianto gas esistente.",
  notes: "",
  estimatedHours: 3,
  actualHours: 2.5,
};

type JobStatus = "scheduled" | "inProgress" | "paused" | "completed" | "toBill";

const statusActions: Record<JobStatus, { label: string; nextStatus: JobStatus; icon: React.ReactNode }> = {
  scheduled: { label: "Inizia Lavoro", nextStatus: "inProgress", icon: <Play className="w-4 h-4" /> },
  inProgress: { label: "Metti in Pausa", nextStatus: "paused", icon: <Pause className="w-4 h-4" /> },
  paused: { label: "Riprendi", nextStatus: "inProgress", icon: <Play className="w-4 h-4" /> },
  completed: { label: "Genera Fattura", nextStatus: "toBill", icon: <FileText className="w-4 h-4" /> },
  toBill: { label: "Fatturato", nextStatus: "toBill", icon: <CheckCircle className="w-4 h-4" /> },
};

export default function JobDetail() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<JobStatus>(jobData.status);
  const [notes, setNotes] = useState(jobData.notes);

  const handleStatusChange = () => {
    if (status === "inProgress") {
      // Show completion dialog or directly complete
      setStatus("completed");
    } else {
      setStatus(statusActions[status].nextStatus);
    }
  };

  const handleComplete = () => {
    setStatus("completed");
  };

  const content = (
    <div className="space-y-6 pb-6">
      {/* Back Button - Desktop only */}
      {!isMobile && (
        <Link to="/lavori">
          <Button variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Torna ai Lavori
          </Button>
        </Link>
      )}

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                #{jobData.id}
              </p>
              <CardTitle className="text-xl">{jobData.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge variant={jobData.priority}>{jobData.priority === "high" ? "Alta" : "Media"}</Badge>
              <Badge variant={status}>
                {status === "inProgress" ? "In corso" : 
                 status === "scheduled" ? "Schedulato" :
                 status === "paused" ? "In pausa" :
                 status === "completed" ? "Completato" : "Da fatturare"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{jobData.client.name}</p>
              <p className="text-sm text-muted-foreground">{jobData.address}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="iconSm" asChild>
                <a href={`tel:${jobData.client.phone}`}>
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="iconSm" asChild>
                <a href={`mailto:${jobData.client.email}`}>
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="iconSm" asChild>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(jobData.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Time & Technician */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{jobData.date} • {jobData.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{jobData.technician}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground">{jobData.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleStatusChange} 
              className="flex-1 gap-2"
              variant={status === "paused" ? "warning" : status === "completed" ? "success" : "default"}
            >
              {statusActions[status].icon}
              {statusActions[status].label}
            </Button>
            {status === "inProgress" && (
              <Button onClick={handleComplete} variant="success" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Completa
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="photos" className="py-2">Foto</TabsTrigger>
          <TabsTrigger value="checklist" className="py-2">Checklist</TabsTrigger>
          <TabsTrigger value="signature" className="py-2">Firma</TabsTrigger>
          <TabsTrigger value="notes" className="py-2">Note</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          <PhotoUpload />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <JobChecklist />
        </TabsContent>

        <TabsContent value="signature" className="mt-4 space-y-4">
          <SignaturePad onSave={(sig) => console.log("Signature saved:", sig)} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="p-4">
            <Textarea
              placeholder="Aggiungi note sul lavoro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </Card>
          <VoiceNotes />
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout title={`#${jobData.id}`}>
        <div className="p-4">{content}</div>
      </MobileLayout>
    );
  }

  return (
    <AppLayout title="Dettaglio Lavoro" subtitle={jobData.title}>
      {content}
    </AppLayout>
  );
}
