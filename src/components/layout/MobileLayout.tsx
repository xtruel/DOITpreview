import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background md:hidden">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="iconSm">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">{title}</h1>
          <Button variant="ghost" size="iconSm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">{children}</main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
