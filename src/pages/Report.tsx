import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Briefcase,
  Users,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const revenueData = [
  { month: "Gen", revenue: 18500, jobs: 45 },
  { month: "Feb", revenue: 22300, jobs: 52 },
  { month: "Mar", revenue: 19800, jobs: 48 },
  { month: "Apr", revenue: 25600, jobs: 61 },
  { month: "Mag", revenue: 28900, jobs: 68 },
  { month: "Giu", revenue: 31200, jobs: 72 },
  { month: "Lug", revenue: 29400, jobs: 65 },
  { month: "Ago", revenue: 21000, jobs: 42 },
  { month: "Set", revenue: 27800, jobs: 58 },
  { month: "Ott", revenue: 32500, jobs: 75 },
  { month: "Nov", revenue: 30100, jobs: 70 },
  { month: "Dic", revenue: 24580, jobs: 55 },
];

const jobsByType = [
  { name: "Installazioni", value: 35, color: "hsl(147, 84%, 36%)" },
  { name: "Manutenzioni", value: 28, color: "hsl(210, 62%, 50%)" },
  { name: "Riparazioni", value: 22, color: "hsl(38, 91%, 55%)" },
  { name: "Sopralluoghi", value: 15, color: "hsl(147, 70%, 60%)" },
];

const technicianPerformance = [
  { name: "Marco B.", jobs: 28, revenue: 12500 },
  { name: "Luigi E.", jobs: 24, revenue: 10800 },
  { name: "Paolo R.", jobs: 22, revenue: 9600 },
  { name: "Andrea C.", jobs: 18, revenue: 8200 },
];

export default function Report() {
  return (
    <AppLayout title="Report" subtitle="Analisi e statistiche aziendali">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
        <div className="flex gap-2">
          <Select defaultValue="year">
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Ultima Settimana</SelectItem>
              <SelectItem value="month">Ultimo Mese</SelectItem>
              <SelectItem value="quarter">Ultimo Trimestre</SelectItem>
              <SelectItem value="year">Anno 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Esporta Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Fatturato Annuo"
          value="€312.680"
          change="+18% vs anno prec."
          changeType="positive"
          icon={Euro}
          iconColor="primary"
        />
        <StatCard
          title="Lavori Completati"
          value="711"
          change="+12% vs anno prec."
          changeType="positive"
          icon={Briefcase}
          iconColor="success"
        />
        <StatCard
          title="Nuovi Clienti"
          value="89"
          change="+24% vs anno prec."
          changeType="positive"
          icon={Users}
          iconColor="info"
        />
        <StatCard
          title="Tempo Medio Lavoro"
          value="2.4h"
          change="-8% vs anno prec."
          changeType="positive"
          icon={Clock}
          iconColor="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Andamento Fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(147, 84%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(147, 84%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(218, 27%, 90%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `€${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(218, 27%, 90%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`€${value.toLocaleString("it-IT")}`, "Fatturato"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(147, 84%, 36%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Jobs by Type */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Lavori per Tipologia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {jobsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(218, 27%, 90%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Percentuale"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {jobsByType.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-semibold ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician Performance */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Performance Tecnici</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={technicianPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(218, 27%, 90%)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `€${value / 1000}k`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(218, 27%, 90%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? `€${value.toLocaleString("it-IT")}` : value,
                    name === "revenue" ? "Fatturato" : "Lavori"
                  ]}
                />
                <Bar dataKey="revenue" fill="hsl(147, 84%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
