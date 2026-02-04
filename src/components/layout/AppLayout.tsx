import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex items-center justify-center h-14 px-4">
            <h1 className="font-semibold text-foreground">{title}</h1>
          </div>
        </header>

        {/* Content with bottom padding for nav */}
        <main className="pb-20 p-4">{children}</main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    );
  }

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
