import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Calendar,
  Euro,
  User,
} from "lucide-react";

type QuoteStatus = "draft" | "sent" | "approved" | "converted";

interface Quote {
  id: string;
  number: string;
  title: string;
  client: string;
  date: string;
  expiryDate: string;
  amount: number;
  status: QuoteStatus;
}

const quotes: Quote[] = [
  {
    id: "1",
    number: "PRV-2024-045",
    title: "Installazione impianto di climatizzazione",
    client: "Marco Rossi",
    date: "15 Gen 2024",
    expiryDate: "15 Feb 2024",
    amount: 4500,
    status: "approved",
  },
  {
    id: "2",
    number: "PRV-2024-046",
    title: "Manutenzione annuale caldaia",
    client: "Laura Bianchi",
    date: "18 Gen 2024",
    expiryDate: "18 Feb 2024",
    amount: 850,
    status: "sent",
  },
  {
    id: "3",
    number: "PRV-2024-047",
    title: "Ristrutturazione impianto idraulico",
    client: "Giuseppe Verdi",
    date: "20 Gen 2024",
    expiryDate: "20 Feb 2024",
    amount: 12800,
    status: "draft",
  },
  {
    id: "4",
    number: "PRV-2024-044",
    title: "Installazione pannelli solari",
    client: "Anna Ferrari",
    date: "10 Gen 2024",
    expiryDate: "10 Feb 2024",
    amount: 8900,
    status: "converted",
  },
];

const statusLabels: Record<QuoteStatus, string> = {
  draft: "Bozza",
  sent: "Inviato",
  approved: "Approvato",
  converted: "Convertito",
};

const statusColors: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  converted: "bg-primary/15 text-primary",
};

export default function Preventivi() {
  return (
    <AppLayout title="Preventivi" subtitle="Gestisci i preventivi per i clienti">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Totale Preventivi</p>
          <p className="text-2xl font-bold">48</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">In Attesa</p>
          <p className="text-2xl font-bold text-info">12</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approvati</p>
          <p className="text-2xl font-bold text-success">28</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valore Totale</p>
          <p className="text-2xl font-bold">€156.800</p>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca preventivo..."
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
            Nuovo Preventivo
          </Button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-3">
        {quotes.map((quote) => (
          <Card key={quote.id} hover className="animate-slide-up">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icon & Main Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {quote.number}
                      </span>
                      <Badge className={statusColors[quote.status]}>
                        {statusLabels[quote.status]}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-foreground truncate">
                      {quote.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {quote.client}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {quote.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="flex items-center gap-1.5">
                    <Euro className="w-5 h-5 text-primary" />
                    <span className="text-xl font-bold">
                      {quote.amount.toLocaleString("it-IT")}
                    </span>
                  </div>
                  <Button variant="ghost" size="iconSm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
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
