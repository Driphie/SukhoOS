import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import Lock from "./pages/Lock";
import Dashboard from "./pages/Dashboard";
import Vision from "./pages/Vision";
import Library from "./pages/Library";
import Planner from "./pages/Planner";
import Study from "./pages/Study";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const LockRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Lock />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/lock" element={<LockRoute />} />
              <Route path="/" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
              <Route path="/vision" element={<ProtectedRoute><AppShell><Vision /></AppShell></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><AppShell><Library /></AppShell></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute><AppShell><Planner /></AppShell></ProtectedRoute>} />
              <Route path="/study" element={<ProtectedRoute><AppShell><Study /></AppShell></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AppShell><Analytics /></AppShell></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
