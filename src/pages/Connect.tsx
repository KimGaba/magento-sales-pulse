
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { addMagentoConnection } from '@/services/supabase';

const Connect = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState(1);
  
  const handleConnect = async () => {
    if (!url.trim() || !apiKey.trim() || !storeName.trim()) {
      toast({
        title: "Fejl ved forbindelse",
        description: "Venligst udfyld både butiksnavn, URL og API-nøgle",
        variant: "destructive",
      });
      return;
    }
    
    if (!user || !user.id) {
      toast({
        title: "Bruger ikke fundet",
        description: "Du skal være logget ind for at forbinde en butik",
        variant: "destructive",
      });
      return;
    }
    
    setConnecting(true);
    
    try {
      // Save connection to database
      await addMagentoConnection(
        user.id,
        url,
        apiKey,
        storeName
      );
      
      // Move to next step on success
      setStep(2);
      
      toast({
        title: "Forbindelse oprettet!",
        description: "Din Magento-butik blev forbundet med succes",
      });
      
      // Simulate sync process
      setTimeout(() => {
        setStep(3);
      }, 5000);
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Forbindelsesfejl",
        description: "Der opstod en fejl ved forbindelse til Magento. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  const handleFinish = () => {
    window.location.href = '/dashboard';
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Forbind din Magento-butik</h1>
        <p className="text-gray-500">Følg disse trin for at forbinde din butik med Sales Pulse</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between mb-10">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-magento-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <p className="text-sm mt-2">Forbind butik</p>
          </div>
          <div className="flex-1 border-t mt-5 mx-4"></div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-magento-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <p className="text-sm mt-2">Synkronisering</p>
          </div>
          <div className="flex-1 border-t mt-5 mx-4"></div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-magento-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <p className="text-sm mt-2">Færdig</p>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Forbind til Magento</CardTitle>
              <CardDescription>
                Indtast din Magento butiksadresse og API-nøgle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Butiksnavn</Label>
                <Input 
                  id="store-name" 
                  placeholder="Min Butik" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
                <p className="text-xs text-gray-500">Et navn til at identificere din butik i systemet</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-url">Magento URL</Label>
                <Input 
                  id="store-url" 
                  placeholder="https://dinbutik.dk" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">F.eks. https://dinbutik.dk</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">API-nøgle</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder="Din Magento API-nøgle" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  <a href="#" className="text-magento-600 hover:underline">
                    Hvor finder jeg min API-nøgle?
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-magento-600 hover:bg-magento-700"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? "Forbinder..." : "Forbind butik"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Database className="h-12 w-12 text-magento-600" />
              </div>
              <CardTitle>Synkroniserer data</CardTitle>
              <CardDescription>
                Vi henter dine butiksdata. Dette kan tage et par minutter...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Produkter</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Ordrer</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Kunder</span>
                  <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Salgstatistikker</span>
                  <span className="text-gray-400">Venter...</span>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-100 rounded-full h-2.5">
                <div className="bg-magento-600 h-2.5 rounded-full w-1/2"></div>
              </div>
              <p className="text-center mt-2 text-sm">50% fuldført</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Dette vindue opdateres automatisk når synkroniseringen er færdig
              </p>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle>Forbindelse fuldført!</CardTitle>
              <CardDescription>
                Din Magento-butik er nu forbundet med Sales Pulse
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Alle dine data er blevet synkroniseret, og du kan nu begynde at bruge
                din salgsoversigt.
              </p>
              
              <div className="mt-6 border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold">Næste skridt:</h3>
                <ul className="text-sm mt-2 space-y-1 text-left list-disc list-inside">
                  <li>Udforsk dit dashboard</li>
                  <li>Undersøg dine bedst sælgende produkter</li>
                  <li>Analyser dine daglige salgsmønstre</li>
                  <li>Opdag trends og indsigter</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-magento-600 hover:bg-magento-700"
                onClick={handleFinish}
              >
                Gå til dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Connect;
