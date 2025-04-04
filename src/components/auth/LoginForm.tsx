import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Mail, Loader2, AlertCircle, UserPlus, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, loginWithGoogle, testLogin } = useAuth();
  const { translations } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showRegisterHint, setShowRegisterHint] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setShowRegisterHint(false);
    
    if (!email || !password) {
      setLoginError(translations.register.emptyFields);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Handling email login submission for:", email);
      await login(email, password);
      // Navigation handled automatically in AuthContext
    } catch (error: any) {
      console.error("Login form error:", error);
      
      if (error.message?.includes("Invalid login credentials")) {
        setLoginError(translations.login.loginError);
        setShowRegisterHint(true);
      } else {
        setLoginError(error.message || 'Der opstod en fejl under login. Prøv igen senere.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setLoginError('');
    setShowRegisterHint(false);
    setIsLoading(true);
    
    try {
      console.log("Handling Google login click");
      await loginWithGoogle();
      // No navigate here - the page will redirect via OAuth flow
    } catch (error: any) {
      console.error("Google login form error:", error);
      
      if (error.message?.includes("provider is not enabled")) {
        setLoginError("Google login er ikke aktiveret. Kontakt venligst administratoren for at aktivere Google-integration i Supabase.");
      } else {
        setLoginError(error.message || 'Der opstod en fejl under Google login. Prøv igen senere.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoginError('');
    setShowRegisterHint(false);
    setIsLoading(true);
    
    try {
      console.log("Handling test login");
      await testLogin();
      // Navigation handled automatically in AuthContext
    } catch (error: any) {
      console.error("Test login form error:", error);
      setLoginError(error.message || 'Der opstod en fejl under test login. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardContent className="space-y-4 pt-4">
        {loginError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        {showRegisterHint && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <UserPlus className="h-4 w-4 mr-2 text-amber-600" />
            <div>
              <AlertTitle className="text-amber-800">{translations.login.newAccountHint}</AlertTitle>
              <AlertDescription className="text-amber-700">
                {translations.login.newAccountText}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <form onSubmit={handleEmailLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{translations.login.email}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{translations.login.password}</Label>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                  {translations.login.forgotPassword}
                </Button>
              </div>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.login.loggingIn}
                </>
              ) : (
                translations.login.loginButton
              )}
            </Button>
          </div>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">{translations.login.continueWith}</span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleLogin}
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
          {translations.login.googleButton}
        </Button>
        
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleTestLogin}
          disabled={isLoading}
          className="w-full"
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Test Login (test@test.dk / 123456)
        </Button>
      </CardContent>
      
      {showRegisterHint && (
        <CardFooter className="px-6 pt-0 pb-5">
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={() => {
              const registerTab = document.querySelector('[data-value="register"]') as HTMLElement;
              if (registerTab) registerTab.click();
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {translations.login.createNewAccount}
          </Button>
        </CardFooter>
      )}
    </>
  );
};

export default LoginForm;
