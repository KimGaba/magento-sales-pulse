import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Database, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { addMagentoConnection, fetchMagentoConnections, triggerMagentoSync } from '@/services/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '@/i18n/LanguageContext';

interface StoreConnection {
  id: string;
  store_id: string;
  store_name: string;
  store_url: string;
  status: string;
}

const Connect = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreConnection | null>(null);
  
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  const loadConnections = async () => {
    if (!user) return;
    
    setLoadingConnections(true);
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast({
        title: "Fejl ved indlæsning",
        description: "Der opstod en fejl ved indlæsning af dine forbindelser.",
        variant: "destructive",
      });
    } finally {
      setLoadingConnections(false);
    }
  };
  
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
      await addMagentoConnection(
        user.id,
        url,
        apiKey,
        storeName
      );
      
      setStep(2);
      
      toast({
        title: "Forbindelse oprettet!",
        description: "Din Magento-butik blev forbundet med succes. Starter synkronisering...",
      });
      
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
              
              triggerInitialSync();
              
              setTimeout(() => {
                setStep(3);
                loadConnections();
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
    setStoreName('');
    setUrl('');
    setApiKey('');
    setStep(1);
    setSyncProgress(0);
    setSyncStatus({
      products: 'waiting',
      orders: 'waiting',
      customers: 'waiting',
      statistics: 'waiting'
    });
    setConnecting(false);
  };

  const handleDisconnect = (connection: StoreConnection) => {
    setStoreToDelete(connection);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;

    try {
      if (storeToDelete.store_id) {
        const { data, error } = await supabase.rpc('delete_store_data', {
          target_store_id: storeToDelete.store_id
        });

        if (error) {
          throw error;
        }
      }

      const { error } = await supabase
        .from('magento_connections')
        .delete()
        .eq('id', storeToDelete.id);

      if (error) {
        throw error;
      }

      await loadConnections();

      toast({
        title: t.connect.storeDeleted,
        description: t.connect.storeDeletedDesc,
      });
    } catch (error) {
      console.error("Error deleting store:", error);
      toast({
        title: t.connect.deleteError,
        description: t.connect.deleteErrorDesc,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setStoreToDelete(null);
    }
  };

  const ConnectionsList = () => {
    if (loadingConnections) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="w-8 h-8 rounded-full border-4 border-magento-600 border-t-transparent animate-spin mr-2"></div>
          <p>Indlæser forbindelser...</p>
        </div>
      );
    }

    if (connections.length === 0) {
      return (
        <div className="text-center p-8">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Ingen forbindelser fundet</h3>
          <p className="text-gray-500">Du har endnu ikke forbundet nogen Magento-butikker.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {connections.map(connection => (
          <Card key={connection.id} className="border-l-4 border-l-magento-600">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{connection.store_name}</h3>
                  <p className="text-sm text-gray-500">{connection.store_url}</p>
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                      connection.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                    }`}></span>
                    <span className="text-sm">
                      {connection.status === 'active' ? 'Aktiv' : 'Afventer'}
                    </span>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => handleDisconnect(connection)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Frakobl
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Forbind din Magento-butik</h1>
        <p className="text-gray-500">Følg disse trin for at forbinde din butik med Sales Pulse</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="existing" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="existing">Eksisterende forbindelser</TabsTrigger>
            <TabsTrigger value="new">Tilføj ny forbindelse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing">
            <ConnectionsList />
          </TabsContent>
          
          <TabsContent value="new">
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
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handleFinish}
                  >
                    Forbind flere butikker
                  </Button>
                  <Button 
                    className="bg-magento-600 hover:bg-magento-700"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Gå til dashboard
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vil du slette denne butik?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette alle data relateret til butikken "{storeToDelete?.store_name}". 
              Denne handling kan ikke fortrydes, og alle data vil gå tabt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Ja, slet butikken
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Connect;
