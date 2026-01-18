import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, Mail, Lock, Ruler, Globe, Palette, Bell, FileText, Shield, AlertTriangle, Info, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/AppStateContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [mealReminder, setMealReminder] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  // Priority: profile from Firebase state > user displayName from Auth > fallback
  const displayName = profile?.displayName || user?.displayName || 'Atleta';
  const email = user?.email || 'Email não disponível';

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair da conta");
    }
  };

  const handleResetPassword = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast.success("Email de redefinição enviado!");
      } catch (error) {
        toast.error("Erro ao enviar email de redefinição");
      }
    } else {
      toast.error("Email não encontrado");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>

        {/* Conta */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Conta</h2>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-muted-foreground" />
                <span className="text-foreground">Nome</span>
              </div>
              <span className="text-muted-foreground">{displayName}</span>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground" />
                <span className="text-foreground">E-mail</span>
              </div>
              <span className="text-muted-foreground text-sm truncate max-w-[180px]">{email}</span>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <button onClick={handleResetPassword} className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-muted-foreground" />
                <span className="text-foreground">Alterar senha</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preferências */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Preferências</h2>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Ruler size={18} className="text-muted-foreground" />
                <span className="text-foreground">Unidades</span>
              </div>
              <span className="text-muted-foreground">kg</span>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-muted-foreground" />
                <span className="text-foreground">Idioma</span>
              </div>
              <span className="text-muted-foreground text-sm">Português (Brasil)</span>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-muted-foreground" />
                <span className="text-foreground">Tema</span>
              </div>
              <div className="flex bg-muted/30 rounded-lg p-0.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      theme === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Sistema"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Notificações</h2>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-foreground">Lembrete de treino</span>
              </div>
              <Switch checked={workoutReminder} onCheckedChange={setWorkoutReminder} />
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-foreground">Lembrete de alimentação</span>
              </div>
              <Switch checked={mealReminder} onCheckedChange={setMealReminder} />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Você pode ajustar horários depois.
          </p>
        </div>

        {/* App */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">App</h2>
          
          <div className="space-y-1">
            <button onClick={() => setShowTermsModal(true)} className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-muted-foreground" />
                <span className="text-foreground">Termos de uso</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <div className="h-px bg-border/50" />
            
            <button onClick={() => setShowPrivacyModal(true)} className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-muted-foreground" />
                <span className="text-foreground">Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <div className="h-px bg-border/50" />
            
            <button onClick={() => setShowDisclaimerModal(true)} className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-muted-foreground" />
                <span className="text-foreground">Disclaimer</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-muted-foreground" />
                <span className="text-foreground">Versão do app</span>
              </div>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </div>

        {/* Sair */}
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full card-glass flex items-center justify-center gap-2 py-4 rounded-2xl border border-destructive/30 hover:border-destructive/50 transition-colors mb-6"
        >
          <LogOut size={18} className="text-destructive" />
          <span className="text-destructive font-medium">Sair</span>
        </button>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Seus dados estão sincronizados na nuvem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/30">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terms Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Ao usar o LevelUp Gym, você concorda com os seguintes termos:</p>
            <p><strong>1. Uso do Aplicativo</strong><br/>O aplicativo é fornecido "como está" para fins de acompanhamento de treinos e nutrição.</p>
            <p><strong>2. Dados do Usuário</strong><br/>Seus dados são armazenados de forma segura e não são compartilhados com terceiros.</p>
            <p><strong>3. Responsabilidade</strong><br/>Consulte um profissional de saúde antes de iniciar qualquer programa de exercícios.</p>
            <p><strong>4. Modificações</strong><br/>Reservamo-nos o direito de modificar estes termos a qualquer momento.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            <p><strong>Coleta de Dados</strong><br/>Coletamos apenas dados necessários para o funcionamento do app: email, dados de treino e nutrição.</p>
            <p><strong>Armazenamento</strong><br/>Seus dados são armazenados de forma segura no Firebase/Firestore com criptografia.</p>
            <p><strong>Compartilhamento</strong><br/>Não vendemos ou compartilhamos seus dados pessoais com terceiros.</p>
            <p><strong>Exclusão</strong><br/>Você pode solicitar a exclusão de seus dados a qualquer momento.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Disclaimer</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            <p><strong>⚠️ Aviso Importante</strong></p>
            <p>O LevelUp Gym é uma ferramenta de acompanhamento e não substitui orientação profissional.</p>
            <p>Antes de iniciar qualquer programa de exercícios ou dieta, consulte um médico, nutricionista ou educador físico.</p>
            <p>Os cálculos de calorias e macros são estimativas baseadas em fórmulas científicas, mas podem variar de pessoa para pessoa.</p>
            <p>O uso do aplicativo é de sua inteira responsabilidade.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Settings;
