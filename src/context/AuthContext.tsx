
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showConfigError, setShowConfigError] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the login page
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        
        if (event === 'SIGNED_IN' && currentSession) {
          setIsAuthenticated(true);
          setUser(currentSession.user);
          setSession(currentSession);
          
          console.log("Signed in, current path:", location.pathname);
          
          // Use setTimeout to avoid immediate navigation which can cause issues
          setTimeout(() => {
            if (isLoginPage) {
              console.log("On login page, redirecting to dashboard");
              navigate('/dashboard', { replace: true });
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
          navigate('/login', { replace: true });
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          // Update local state when token is refreshed to maintain session
          setIsAuthenticated(true);
          setUser(currentSession.user);
          setSession(currentSession);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("Session check:", currentSession);
      
      if (currentSession) {
        setIsAuthenticated(true);
        setUser(currentSession.user);
        setSession(currentSession);
        
        // Only redirect if on login page
        if (isLoginPage) {
          console.log("Already authenticated, redirecting from login to dashboard");
          navigate('/dashboard', { replace: true });
        }
      } else if (!isLoginPage) {
        // If not authenticated and not on login page, redirect to login
        console.log("Not authenticated, redirecting to login");
        navigate('/login', { replace: true });
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isLoginPage]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting email login with:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Login successful!');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login fejlede: ${error.message}`);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log("Starting Google login...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      console.log("Google login response:", { data, error });
      
      if (error) {
        console.error("Google authentication error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(`Google login fejlede: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      navigate('/login', { replace: true });
      toast.success('Logget ud');
    } catch (error: any) {
      toast.error(`Logout fejlede: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, loginWithGoogle, logout }}>
      {children}
      <Dialog open={showConfigError} onOpenChange={setShowConfigError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfigurationsfejl</DialogTitle>
            <DialogDescription>
              Supabase er ikke korrekt konfigureret i denne applikation. Dette forhindrer login og adgang til data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              For at løse dette problem skal VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY miljøvariable være korrekt konfigureret.
            </p>
            <p>
              Kontakt venligst systemadministratoren for at få dette løst.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowConfigError(false)}>Luk</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
};
