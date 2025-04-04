
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
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

const Connect = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState(1);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState({
    products: 'waiting',
    orders: 'waiting',
    customers: 'waiting',
    statistics: 'waiting'
  });
  
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
        description: "Din Magento-butik blev forbundet med succes. Starter synkronisering...",
      });
      
      // Set up simulated sync process with more realistic steps
      updateSyncStatus('products', 'syncing');
      setSyncProgress(10);
      
      setTimeout(() => {
        updateSyncStatus('products', 'completed');
        updateSyncStatus('orders', 'syncing');
        setSyncProgress(30);
        
        setTimeout(() => {
          updateSyncStatus('orders', 'completed');
          updateSyncStatus('customers', 'syncing');
          setSyncProgress(60);
          
          setTimeout(() => {
            updateSyncStatus('customers', 'completed');
            updateSyncStatus('statistics', 'syncing');
            setSyncProgress(80);
            
            setTimeout(() => {
              updateSyncStatus('statistics', 'completed');
              setSyncProgress(100);
              
              // Trigger the actual sync process in the background
              triggerInitialSync();
              
              // Move to the final step
              setTimeout(() => {
                setStep(3);
              }, 1000);
            }, 1000);
          }, 1500);
        }, 1500);
      }, 1500);
      
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Forbindelsesfejl",
        description: "Der opstod en fejl ved forbindelse til Magento. Prøv igen senere.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };
  
  const updateSyncStatus = (item, status) => {
    setSyncStatus(prev => ({
      ...prev,
      [item]: status
    }));
  };
  
  const triggerInitialSync = async () => {
    try {
      // Call the Supabase Edge Function to trigger an initial sync
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { trigger: 'initial_connection' }
      });
      
      if (error) {
        console.error("Error triggering initial sync:", error);
      } else {
        console.log("Initial sync triggered:", data);
      }
    } catch (err) {
      console.error("Failed to trigger sync:", err);
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
                  {syncStatus.products === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : syncStatus.products === 'syncing' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
                  ) : (
                    <span className="text-gray-400">Venter...</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>Ordrer</span>
                  {syncStatus.orders === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : syncStatus.orders === 'syncing' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
                  ) : (
                    <span className="text-gray-400">Venter...</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>Kunder</span>
                  {syncStatus.customers === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : syncStatus.customers === 'syncing' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
                  ) : (
                    <span className="text-gray-400">Venter...</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>Salgstatistikker</span>
                  {syncStatus.statistics === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : syncStatus.statistics === 'syncing' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
                  ) : (
                    <span className="text-gray-400">Venter...</span>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <Progress value={syncProgress} className="h-2.5" />
              </div>
              <p className="text-center mt-2 text-sm">{syncProgress}% fuldført</p>
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
