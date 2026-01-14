import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStateContext } from '@/contexts/AppStateContext';
import { isDevModeBypass, load } from '@/lib/localStore';
import type { AppState } from '@/lib/appState';

const DEV_STATE_KEY = 'levelup.devState.v1';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const { state, loading: stateLoading, isOnboardingComplete } = useAppStateContext();
  const location = useLocation();
  const devBypass = isDevModeBypass();

  // Enhanced onboarding check - includes localStorage fallback
  const checkOnboardingComplete = (): boolean => {
    // Check context first
    if (isOnboardingComplete()) return true;
    
    // Fallback: check localStorage directly
    const savedState = load<AppState | null>(DEV_STATE_KEY, null);
    if (savedState?.onboarding?.completedAt != null) return true;
    
    return false;
  };

  // Debug log
  console.log('[ProtectedRoute] Check:', {
    path: location.pathname,
    devBypass,
    stateLoading,
    hasState: !!state,
    onboardingCompletedAt: state?.onboarding?.completedAt,
    isComplete: checkOnboardingComplete(),
    skipOnboarding
  });

  // Dev mode bypass - skip auth entirely but still check onboarding via state
  if (devBypass) {
    // In dev mode without state, show loading
    if (stateLoading) {
      console.log('[ProtectedRoute] Dev mode - still loading state');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }
    
    const onboardingComplete = checkOnboardingComplete();
    console.log('[ProtectedRoute] Dev mode - onboarding check:', { skipOnboarding, onboardingComplete });
    
    if (!skipOnboarding && !onboardingComplete) {
      console.log('[ProtectedRoute] Dev mode - redirecting to onboarding');
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    console.log('[ProtectedRoute] Dev mode - allowing access');
    return <>{children}</>;
  }

  // Se Firebase não está configurado, permitir acesso (desenvolvimento)
  if (!isConfigured) {
    if (stateLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }
    
    if (!skipOnboarding && !checkOnboardingComplete()) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Mostra loading enquanto verifica autenticação ou carrega estado
  if (authLoading || stateLoading) {
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
  if (!skipOnboarding && !checkOnboardingComplete()) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
