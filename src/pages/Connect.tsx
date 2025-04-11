import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { useToast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { addMagentoConnection, MagentoConnection, triggerMagentoSync } from '@/services/magentoService';
import { useSyncProcess } from '@/hooks/useSyncProcess';
import { Profile } from '@/types/database';
import { fetchUserProfile } from '@/services/profileService';
import Layout from '@/components/layout/Layout';

const Connect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: sonnerToast } = useToast();
  const [storeUrl, setStoreUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connectionData, setConnectionData] = useState<MagentoConnection | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storeId, setStoreId] = useState('');
  const { 
    step, 
    syncProgress, 
    syncStatus, 
    connecting,
    realSyncProgress,
    setConnecting, 
    startSyncProcess,
    setStep, 
    resetSyncProcess 
  } = useSyncProcess();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleStoreUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreUrl(e.target.value);
  };

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(e.target.value);
  };

  const handleAccessTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value);
  };

  const handleStoreIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreId(e.target.value);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      if (!storeUrl || !storeName || !accessToken || !storeId) {
        toast({
          title: "Udfyld venligst alle felter",
          description: "Alle felter skal udfyldes for at oprette en forbindelse.",
          variant: "destructive"
        });
        return;
      }

      const newConnection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        store_id: storeId,
        store_url: storeUrl,
        store_name: storeName,
        access_token: accessToken,
        status: 'pending'
      };

      const connectedStore = await addMagentoConnection(newConnection);
      setConnectionData(connectedStore);
      
      sonnerToast({
        title: "Butik forbundet!",
        description: "Din Magento-butik er nu forbundet. Synkronisering starter...",
      });
      
      startSyncProcess(storeId);
    } catch (error) {
      console.error("Error connecting to Magento:", error);
      toast({
        title: "Fejl ved oprettelse af forbindelse",
        description: "Der opstod en fejl ved oprettelse af forbindelse til Magento. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleStartSync = async () => {
    setConnecting(true);
    try {
      await triggerMagentoSync(storeId);
      
      sonnerToast({
        title: "Synkronisering startet",
        description: "Dit Magento data bliver nu synkroniseret. Dette kan tage nogle minutter.",
      });
      
      if (connectionData) {
        setConnectionData({
          ...connectionData,
          status: 'active'
        });
        
        setStep(2);
      }
    } catch (error) {
      console.error("Error starting sync:", error);
      toast({
        title: "Fejl ved start af synkronisering",
        description: "Der opstod en fejl ved start af synkronisering. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleRetrySync = async (connection: MagentoConnection) => {
    try {
      await triggerMagentoSync(connection.store_id || '');
      sonnerToast({
        title: "Synkronisering genstartet",
        description: "Dit Magento data bliver nu synkroniseret igen. Dette kan tage nogle minutter.",
      });
    } catch (error) {
      console.error("Error restarting sync:", error);
      toast({
        title: "Fejl ved genstart af synkronisering",
        description: "Der opstod en fejl ved genstart af synkronisering. Prøv igen senere.",
        variant: "destructive"
      });
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="container mx-auto mt-10">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Forbind din Magento butik</CardTitle>
              <CardDescription>
                Indtast dine Magento butiksoplysninger for at oprette forbindelse.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="storeId">Store ID</Label>
                <Input 
                  id="storeId" 
                  value={storeId} 
                  onChange={handleStoreIdChange} 
                  placeholder="Dit unikke butiks-id" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeUrl">Butiks URL</Label>
                <Input
                  id="storeUrl"
                  placeholder="https://din-butik.dk"
                  type="url"
                  value={storeUrl}
                  onChange={handleStoreUrlChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeName">Butiksnavn</Label>
                <Input
                  id="storeName"
                  placeholder="Navnet på din butik"
                  type="text"
                  value={storeName}
                  onChange={handleStoreNameChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accessToken">Adgangstoken</Label>
                <Input
                  id="accessToken"
                  placeholder="Dit Magento adgangstoken"
                  type="password"
                  value={accessToken}
                  onChange={handleAccessTokenChange}
                />
              </div>
              <Button disabled={connecting} onClick={handleConnect}>
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opretter forbindelse...
                  </>
                ) : (
                  "Opret forbindelse"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Synkroniserer din butik</CardTitle>
              <CardDescription>
                Vi synkroniserer i øjeblikket dine Magento data. Dette kan tage et par minutter.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                <p>
                  {realSyncProgress ? (
                    `Synkroniserer data: ${realSyncProgress.orders_processed} / ${realSyncProgress.total_orders || '?'}`
                  ) : (
                    `Synkroniserer data: ${syncProgress}%`
                  )}
                </p>
                <progress className="w-full h-2 bg-gray-200 rounded" value={realSyncProgress ? (realSyncProgress.orders_processed / realSyncProgress.total_orders) * 100 : syncProgress} max="100"></progress>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Produkter</p>
                  <p className="text-xs">{syncStatus.products}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Ordrer</p>
                  <p className="text-xs">{syncStatus.orders}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Kunder</p>
                  <p className="text-xs">{syncStatus.customers}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Statistikker</p>
                  <p className="text-xs">{syncStatus.statistics}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Butikken er forbundet!</CardTitle>
              <CardDescription>
                Din Magento butik er nu forbundet og synkroniseret.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Du er nu klar til at udforske dine data.
              </p>
              <Button onClick={handleGoToDashboard}>Gå til instrumentpanelet</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Connect;
