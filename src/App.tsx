import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppStateProvider } from "@/contexts/AppStateContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Treino from "./pages/Treino";
import WorkoutDetail from "./pages/WorkoutDetail";
import ActiveWorkout from "./pages/ActiveWorkout";
import ExerciseLogging from "./pages/ExerciseLogging";
import WorkoutSummary from "./pages/WorkoutSummary";
import Nutricao from "./pages/Nutricao";
import CriarDieta from "./pages/CriarDieta";
import AdicionarAlimento from "./pages/AdicionarAlimento";
import NutritionSummary from "./pages/NutritionSummary";
import SettingsPage from "./pages/Settings";
import AjustarPlano from "./pages/AjustarPlano";
import Conquistas from "./pages/Conquistas";

import Progresso from "./pages/Progresso";
import Login from "./pages/Login";
import RestDay from "./pages/RestDay";
import Onboarding from "./pages/Onboarding";
import ObjectiveOnboarding from "./pages/ObjectiveOnboarding";
import NotFound from "./pages/NotFound";
import Arena from "./pages/Arena";
import PostDetail from "./pages/PostDetail";
import ClanHub from "./pages/ClanHub";
import CreateClan from "./pages/CreateClan";
import JoinClan from "./pages/JoinClan";
import AthleteProfile from "./pages/AthleteProfile";
import SearchUsers from "./pages/SearchUsers";
import EditProfile from "./pages/EditProfile";

const queryClient = new QueryClient();

// Inner component that uses hooks - must be inside AuthProvider
function AppRoutes() {
  return (
    <AppStateProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Onboarding - requires auth but skips onboarding check */}
        <Route path="/onboarding" element={
          <ProtectedRoute skipOnboarding>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Arena /></ProtectedRoute>} />
        <Route path="/treino" element={<ProtectedRoute><Treino /></ProtectedRoute>} />
        <Route path="/treino/ajustar" element={<ProtectedRoute><AjustarPlano /></ProtectedRoute>} />
        <Route path="/treino/:treinoId" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
        <Route path="/treino/:treinoId/ativo" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
        <Route path="/treino/:treinoId/:exercicioId" element={<ProtectedRoute><ExerciseLogging /></ProtectedRoute>} />
        <Route path="/treino/:treinoId/resumo" element={<ProtectedRoute><WorkoutSummary /></ProtectedRoute>} />
        <Route path="/arena" element={<ProtectedRoute><Arena /></ProtectedRoute>} />
        <Route path="/arena/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/arena/profile/:userId" element={<ProtectedRoute><AthleteProfile /></ProtectedRoute>} />
        <Route path="/arena/search" element={<ProtectedRoute><SearchUsers /></ProtectedRoute>} />
        <Route path="/arena/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/arena/clan" element={<ProtectedRoute><ClanHub /></ProtectedRoute>} />
        <Route path="/arena/clan/create" element={<ProtectedRoute><CreateClan /></ProtectedRoute>} />
        <Route path="/arena/clan/join" element={<ProtectedRoute><JoinClan /></ProtectedRoute>} />
        <Route path="/arena/clan/invite/:code" element={<ProtectedRoute><JoinClan /></ProtectedRoute>} />
        <Route path="/nutricao" element={<ProtectedRoute><Nutricao /></ProtectedRoute>} />
        <Route path="/nutricao/criar-dieta" element={<ProtectedRoute><CriarDieta /></ProtectedRoute>} />
        <Route path="/nutricao/adicionar-alimento" element={<ProtectedRoute><AdicionarAlimento /></ProtectedRoute>} />
        <Route path="/nutricao/resumo" element={<ProtectedRoute><NutritionSummary /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/objetivo" element={<ProtectedRoute><ObjectiveOnboarding /></ProtectedRoute>} />
        <Route path="/conquistas" element={<ProtectedRoute><Conquistas /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/progresso" element={<ProtectedRoute><Progresso /></ProtectedRoute>} />
        <Route path="/descanso" element={<ProtectedRoute><RestDay /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppStateProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
