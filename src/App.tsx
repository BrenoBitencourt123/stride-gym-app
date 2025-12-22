import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Treino from "./pages/Treino";
import WorkoutDetail from "./pages/WorkoutDetail";
import ExerciseLogging from "./pages/ExerciseLogging";
import Nutricao from "./pages/Nutricao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/treino/:slug" element={<WorkoutDetail />} />
          <Route path="/treino/:slug/:exerciseSlug" element={<ExerciseLogging />} />
          <Route path="/nutricao" element={<Nutricao />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
