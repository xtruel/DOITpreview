import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MoreVertical,
  FileText,
  Calendar,
  Euro,
  User,
  Loader2,
} from "lucide-react";
import { useQuotes, QuoteStatus, CreateQuoteData } from "@/hooks/useQuotes";
import { useClients } from "@/hooks/useClients";

const statusLabels: Record<QuoteStatus, string> = {
  draft: "Bozza",
  sent: "Inviato",
  approved: "Approvato",
  rejected: "Rifiutato",
  converted: "Convertito",
};

const statusColors: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  converted: "bg-primary/15 text-primary",
};

export default function Preventivi() {
  const { quotes, isLoading, createQuote } = useQuotes();
  const { clients } = useClients();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateQuoteData>({
    title: "",
    description: "",
    client_id: "",
    amount: 0,
    expiry_date: "",
  });

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      quote.title.toLowerCase().includes(search.toLowerCase()) ||
      quote.clients?.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === "sent").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    totalValue: quotes.reduce((sum, q) => sum + Number(q.amount), 0),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createQuote.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({ title: "", description: "", client_id: "", amount: 0, expiry_date: "" });
  };

  if (isLoading) {
    return (
      <AppLayout title="Preventivi" subtitle="Gestisci i preventivi per i clienti">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Preventivi" subtitle="Gestisci i preventivi per i clienti">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Totale Preventivi</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">In Attesa</p>
          <p className="text-2xl font-bold text-info">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approvati</p>
          <p className="text-2xl font-bold text-success">{stats.approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valore Totale</p>
          <p className="text-2xl font-bold">€{stats.totalValue.toLocaleString("it-IT")}</p>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca preventivo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtri
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuovo Preventivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo Preventivo</DialogTitle>
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
                    <Label htmlFor="amount">Importo (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Scadenza</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createQuote.isPending || !formData.client_id}>
                  {createQuote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crea Preventivo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {search ? "Nessun preventivo trovato" : "Nessun preventivo presente. Crea il primo!"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => (
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
                          {quote.quote_number}
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
                          {quote.clients?.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(quote.created_at).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="flex items-center gap-1.5">
                      <Euro className="w-5 h-5 text-primary" />
                      <span className="text-xl font-bold">
                        {Number(quote.amount).toLocaleString("it-IT")}
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
      )}

      {/* FAB */}
      <Button variant="fab" size="fab" onClick={() => setIsDialogOpen(true)}>
        <Plus className="w-6 h-6" />
      </Button>
    </AppLayout>
  );
}
