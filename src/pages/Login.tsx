
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSelector from '@/components/layout/LanguageSelector';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { translations } = useLanguage();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');

  // Check if there's an error in the URL (from OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const register = params.get('register');
    
    if (error) {
      setOauthError(`${error}: ${errorDescription || 'Unexpected error during login. Please try again later.'}`);
    }

    // If register parameter exists, switch to register tab
    if (register === 'true') {
      setActiveTab('register');
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/b987e83a-8258-4105-ad71-1cc75ec496f7.png" 
              alt="Logo" 
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" asChild>
              <Link to="/">{translations.common.back}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{translations.login.title}</CardTitle>
            {translations.login.subtitle && (
              <CardDescription>
                {translations.login.subtitle}
              </CardDescription>
            )}
          </CardHeader>

          {oauthError && (
            <div className="px-6">
              <Alert variant="destructive" className="mb-4">
                <InfoIcon className="h-4 w-4 mr-2" />
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            </div>
          )}

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-value="login">
                {translations.login.loginTab || translations.common.login}
              </TabsTrigger>
              <TabsTrigger value="register" data-value="register">
                {translations.login.registerTab || translations.common.register}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <footer className="bg-white py-6 border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
