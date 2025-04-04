
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Check if there's an error in the URL (from OAuth redirect)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error) {
      setOauthError(`${error}: ${errorDescription || 'Uventet fejl ved login. Prøv igen senere.'}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/77d4d3a2-fd52-4411-8a63-380c197c5c7a.png" 
              alt="MetricMate Logo" 
              className="h-8 mr-2"
            />
            <h1 className="text-xl font-bold">MetricMate</h1>
          </div>
          <nav>
            <Button variant="ghost" onClick={() => navigate('/')}>Tilbage til forsiden</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Log ind på MetricMate</CardTitle>
            <CardDescription>
              Få adgang til din butiks indsigter
            </CardDescription>
          </CardHeader>

          {oauthError && (
            <div className="px-6">
              <Alert variant="destructive" className="mb-4">
                <InfoIcon className="h-4 w-4 mr-2" />
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log ind</TabsTrigger>
              <TabsTrigger value="register">Opret konto</TabsTrigger>
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
          <p>© {new Date().getFullYear()} MetricMate. Alle rettigheder forbeholdes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
