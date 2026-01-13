import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isOnboardingComplete } from '@/lib/onboarding';
import { isDevModeBypass } from '@/lib/localStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: ProtectedRouteProps) => {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  // Dev mode bypass - skip auth entirely
  if (isDevModeBypass()) {
    if (!skipOnboarding && !isOnboardingComplete()) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Se Firebase não está configurado, permitir acesso (desenvolvimento)
  if (!isConfigured) {
    // Em desenvolvimento, ainda verificar onboarding
    if (!skipOnboarding && !isOnboardingComplete()) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redireciona para login se não autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se onboarding está completo (exceto em rotas específicas)
  if (!skipOnboarding && !isOnboardingComplete()) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
