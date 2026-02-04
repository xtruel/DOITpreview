import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  initials: string;
  jobsCount: number;
  tags: string[];
}

const clients: Client[] = [
  {
    id: "1",
    name: "Marco Rossi",
    company: "Rossi Immobiliare SRL",
    email: "marco@rossiimmobiliare.it",
    phone: "+39 333 1234567",
    address: "Via Roma 123, 20121 Milano",
    initials: "MR",
    jobsCount: 12,
    tags: ["Premium", "Residenziale"],
  },
  {
    id: "2",
    name: "Laura Bianchi",
    email: "laura.bianchi@email.it",
    phone: "+39 347 9876543",
    address: "Via Milano 45, 20124 Milano",
    initials: "LB",
    jobsCount: 5,
    tags: ["Residenziale"],
  },
  {
    id: "3",
    name: "Giuseppe Verdi",
    company: "Verdi & Partners",
    email: "g.verdi@verdipartners.it",
    phone: "+39 339 4567890",
    address: "Corso Venezia 78, 20121 Milano",
    initials: "GV",
    jobsCount: 28,
    tags: ["Business", "Premium"],
  },
  {
    id: "4",
    name: "Anna Ferrari",
    company: "Condominio Aurora",
    email: "admin@condominioaurora.it",
    phone: "+39 02 12345678",
    address: "Via Torino 156, 20123 Milano",
    initials: "AF",
    jobsCount: 45,
    tags: ["Condominio", "Manutenzione"],
  },
];

export default function Clienti() {
  return (
    <AppLayout title="Clienti" subtitle="Gestisci la tua anagrafica clienti">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca cliente per nome, email o telefono..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtri
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuovo Cliente
          </Button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} hover className="animate-slide-up">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {client.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {client.name}
                    </h4>
                    {client.company && (
                      <p className="text-sm text-muted-foreground">
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="iconSm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{client.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="font-medium">{client.jobsCount}</span>
                  <span className="text-muted-foreground">lavori</span>
                </div>
                <div className="flex gap-1.5">
                  {client.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAB */}
      <Button variant="fab" size="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
