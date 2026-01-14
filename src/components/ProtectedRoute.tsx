import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStateContext } from '@/contexts/AppStateContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { state, loading: stateLoading, isOnboardingComplete } = useAppStateContext();
  const location = useLocation();

  // Debug log
  console.log('[ProtectedRoute] Check:', {
    path: location.pathname,
    authLoading,
    stateLoading,
    hasUser: !!user,
    hasState: !!state,
    onboardingComplete: state ? isOnboardingComplete() : 'waiting',
    skipOnboarding
  });

  // Loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → Login
  if (!user) {
    console.log('[ProtectedRoute] No user - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but state still loading → Show loading
  if (stateLoading || state === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Authenticated, state loaded, but onboarding not complete → Onboarding
  if (!skipOnboarding && !isOnboardingComplete()) {
    console.log('[ProtectedRoute] Onboarding not complete - redirecting to onboarding');
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // All checks passed → Render children
  return <>{children}</>;
};

export default ProtectedRoute;
