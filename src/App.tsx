import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clienti from "./pages/Clienti";
import Preventivi from "./pages/Preventivi";
import Calendario from "./pages/Calendario";
import Lavori from "./pages/Lavori";
import JobDetail from "./pages/JobDetail";
import PublicJobStatus from "./pages/PublicJobStatus";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (DEMO) {
    return <>{children}</>;
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// App routes component
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/job/:token/status" element={<PublicJobStatus />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/clienti" element={<ProtectedRoute><Clienti /></ProtectedRoute>} />
      <Route path="/preventivi" element={<ProtectedRoute><Preventivi /></ProtectedRoute>} />
      <Route path="/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
      <Route path="/lavori" element={<ProtectedRoute><Lavori /></ProtectedRoute>} />
      <Route path="/lavori/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
