import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn("ml-64 min-h-screen transition-all duration-300")}>
        <Header title={title} subtitle={subtitle} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
