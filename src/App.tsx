import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Treino from "./pages/Treino";
import WorkoutDetail from "./pages/WorkoutDetail";
import ExerciseLogging from "./pages/ExerciseLogging";
import WorkoutSummary from "./pages/WorkoutSummary";
import Nutricao from "./pages/Nutricao";
import CriarDieta from "./pages/CriarDieta";
import AdicionarAlimento from "./pages/AdicionarAlimento";
import NutritionSummary from "./pages/NutritionSummary";
import SettingsPage from "./pages/Settings";
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
          <Route path="/treino/:treinoId" element={<WorkoutDetail />} />
          <Route path="/treino/:treinoId/:exercicioId" element={<ExerciseLogging />} />
          <Route path="/treino/:treinoId/resumo" element={<WorkoutSummary />} />
          <Route path="/nutricao" element={<Nutricao />} />
          <Route path="/nutricao/criar-dieta" element={<CriarDieta />} />
          <Route path="/nutricao/adicionar-alimento" element={<AdicionarAlimento />} />
          <Route path="/nutricao/resumo" element={<NutritionSummary />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
