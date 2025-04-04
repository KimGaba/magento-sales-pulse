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
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  testLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  testLogin: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showConfigError, setShowConfigError] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = location.pathname === '/login' || location.pathname === '/';
  
  console.log("AuthContext initialized, current path:", location.pathname);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        
        if (currentSession) {
          console.log("User authenticated:", currentSession.user?.email);
          setIsAuthenticated(true);
          setUser(currentSession.user);
          setSession(currentSession);
          
          if (location.pathname === '/login' && isInitialized) {
            console.log("Redirecting from login to dashboard");
            navigate('/dashboard', { replace: true });
          }
        } else {
          console.log("No active session");
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
          
          if (!isPublicPage && isInitialized) {
            console.log("Not authenticated, redirecting to login");
            navigate('/login', { replace: true });
          }
        }
      }
    );

    const checkSession = async () => {
      console.log("Checking for existing session...");
      try {
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Session check result:", data.session, error);
        
        if (error) {
          console.error("Error checking session:", error);
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
        } else if (data.session) {
          console.log("Found existing session:", data.session.user?.email);
          setIsAuthenticated(true);
          setUser(data.session.user);
          setSession(data.session);
          
          if (location.pathname === '/login') {
            console.log("Already logged in, redirecting to dashboard");
            navigate('/dashboard', { replace: true });
          }
        } else {
          console.log("No existing session found");
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
          
          if (!isPublicPage) {
            console.log("No session, redirecting to login");
            navigate('/login', { replace: true });
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
        setIsInitialized(true);
      }
    };

    checkSession();

    return () => {
      console.log("Cleaning up auth effect, unsubscribing");
      subscription.unsubscribe();
    };
  }, [navigate, isPublicPage, location.pathname, isInitialized]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting email login with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Login successful, session:", data.session);
      toast.success('Login successful!');
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login fejlede: ${error.message}`);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      console.log("Attempting registration with:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) throw error;
      
      console.log("Registration successful:", data);
      return;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(`Registration fejlede: ${error.message}`);
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
      console.log("Attempting logout");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("Logout successful");
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      navigate('/login', { replace: true });
      toast.success('Logget ud');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(`Logout fejlede: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      console.log("Attempting test user login");
      const testEmail = "test@test.dk";
      const testPassword = "1234";
      
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (checkError && checkError.message.includes("Invalid login credentials")) {
        console.log("Test user doesn't exist, creating it");
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              email_confirmed: true
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (loginError) throw loginError;
        
        console.log("Test login successful:", loginData);
        toast.success('Logget ind som test bruger');
      } else if (existingUser) {
        console.log("Test login successful with existing user");
        toast.success('Logget ind som test bruger');
      } else if (checkError) {
        throw checkError;
      }
    } catch (error: any) {
      console.error("Test login error:", error);
      toast.error(`Test login fejlede: ${error.message}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, loginWithGoogle, register, logout, testLogin }}>
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
