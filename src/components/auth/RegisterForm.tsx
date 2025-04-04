
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Fejl ved registrering",
        description: "Udfyld venligst alle felter",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Fejl ved registrering",
        description: "Adgangskoderne matcher ikke",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Dette er en simuleret registreringsproces
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Konto oprettet!",
        description: "Du er nu registreret og logget ind.",
      });
      // I en rigtig implementation ville vi her gemme en auth token
      localStorage.setItem("isLoggedIn", "true");
      navigate('/dashboard');
    }, 1500);
  };
  
  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setRegisterError('');
    
    try {
      await loginWithGoogle();
      // No navigate here - the page will redirect via OAuth flow
    } catch (error: any) {
      console.error("Google login error:", error);
      
      if (error.message?.includes("provider is not enabled")) {
        setRegisterError("Google login er ikke aktiveret. Kontakt venligst administratoren for at aktivere Google-integration i Supabase Console under Authentication > Providers.");
      } else if (error.message?.includes("invalid site_url")) {
        setRegisterError("URL konfiguration mangler. Kontakt venligst administratoren for at konfigurere Site URL og Redirect URLs i Supabase Console under Authentication > URL Configuration.");
      } else {
        setRegisterError(error.message || 'Der opstod en fejl ved Google login. Prøv igen senere.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardContent className="space-y-4 pt-4">
        {registerError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{registerError}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input 
                id="register-email" 
                type="email" 
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Adgangskode</Label>
              <Input 
                id="register-password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Bekræft adgangskode</Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
                disabled={isLoading}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-magento-600 hover:bg-magento-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opretter konto...
                </>
              ) : (
                'Opret konto'
              )}
            </Button>
          </div>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Eller fortsæt med</span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleRegister}
          disabled={isLoading}
          className="w-full"
        >
          <svg 
            className="mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 48 48"
          >
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Fortsæt med Google
        </Button>
      </CardContent>
    </>
  );
};

export default RegisterForm;
