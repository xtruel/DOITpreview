import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  initials: string;
}

const recentClients: Client[] = [
  {
    id: "1",
    name: "Marco Rossi",
    company: "Rossi Immobiliare",
    phone: "+39 333 1234567",
    email: "marco@rossi.it",
    initials: "MR",
  },
  {
    id: "2",
    name: "Laura Bianchi",
    phone: "+39 347 9876543",
    email: "laura.b@email.it",
    initials: "LB",
  },
  {
    id: "3",
    name: "Giuseppe Verdi",
    company: "Verdi & Co",
    phone: "+39 339 4567890",
    email: "g.verdi@verdico.it",
    initials: "GV",
  },
];

export function RecentClients() {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Clienti Recenti</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            Vedi tutti
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentClients.map((client) => (
          <div
            key={client.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {client.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-sm truncate">{client.name}</h5>
              {client.company && (
                <p className="text-xs text-muted-foreground truncate">
                  {client.company}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="iconSm" className="text-muted-foreground hover:text-primary">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="iconSm" className="text-muted-foreground hover:text-primary">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
