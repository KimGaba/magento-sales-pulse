
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

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
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
  const [user, setUser] = useState<any>(null);
  const [showConfigError, setShowConfigError] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in via Supabase session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Initial session check:", data.session);
      if (data.session) {
        setIsAuthenticated(true);
        setUser(data.session.user);
        
        // Only redirect if on login page
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          setUser(session.user);
          
          // Use setTimeout to avoid potential state update conflicts
          setTimeout(() => {
            if (location.pathname === '/login' || location.pathname === '/') {
              navigate('/dashboard');
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          navigate('/');
        } else if (event === 'TOKEN_REFRESHED') {
          // Update local state when token is refreshed to maintain session
          setIsAuthenticated(true);
          setUser(session?.user || null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
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
      navigate('/');
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
