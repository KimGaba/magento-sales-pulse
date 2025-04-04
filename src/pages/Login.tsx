
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { CircleInfo } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

          <div className="p-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center mb-2">
              <CircleInfo className="h-4 w-4 mr-1" />
              <p>For at aktivere Google login:</p>
            </div>
            <ol className="text-left list-decimal ml-6 text-xs">
              <li>Konfigurer OAuth i Google Cloud Console</li>
              <li>Tilføj OAuth-oplysninger i Supabase under Authentication {'>'} Providers {'>'} Google</li>
              <li>Konfigurer Site URL og Redirect URLs i Supabase under Authentication {'>'} URL Configuration</li>
            </ol>
          </div>
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
