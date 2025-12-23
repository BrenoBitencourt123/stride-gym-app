import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import AjustarPlano from "./pages/AjustarPlano";
import Conquistas from "./pages/Conquistas";
import Perfil from "./pages/Perfil";
import Progresso from "./pages/Progresso";
import Login from "./pages/Login";
import RestDay from "./pages/RestDay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/treino" element={<ProtectedRoute><Treino /></ProtectedRoute>} />
            <Route path="/treino/ajustar" element={<ProtectedRoute><AjustarPlano /></ProtectedRoute>} />
            <Route path="/treino/:treinoId" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
            <Route path="/treino/:treinoId/:exercicioId" element={<ProtectedRoute><ExerciseLogging /></ProtectedRoute>} />
            <Route path="/treino/:treinoId/resumo" element={<ProtectedRoute><WorkoutSummary /></ProtectedRoute>} />
            <Route path="/nutricao" element={<ProtectedRoute><Nutricao /></ProtectedRoute>} />
            <Route path="/nutricao/criar-dieta" element={<ProtectedRoute><CriarDieta /></ProtectedRoute>} />
            <Route path="/nutricao/adicionar-alimento" element={<ProtectedRoute><AdicionarAlimento /></ProtectedRoute>} />
            <Route path="/nutricao/resumo" element={<ProtectedRoute><NutritionSummary /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/conquistas" element={<ProtectedRoute><Conquistas /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/progresso" element={<ProtectedRoute><Progresso /></ProtectedRoute>} />
            <Route path="/descanso" element={<ProtectedRoute><RestDay /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
