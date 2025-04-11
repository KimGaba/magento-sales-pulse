
console.log("✅ This is the latest build of Connect.tsx");

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
import { addMagentoConnection, fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { useSyncProcess } from '@/hooks/useSyncProcess';

// Import our components
import ConnectionsList from '@/components/connect/ConnectionsList';
import ConnectionForm from '@/components/connect/ConnectionForm';
import SyncProgress from '@/components/connect/SyncProgress';
import ConnectionComplete from '@/components/connect/ConnectionComplete';
import DeleteConnectionDialog from '@/components/connect/DeleteConnectionDialog';

interface StoreConnection {
  id: string;
  store_id?: string;
  store_name: string;
  store_url: string;
  status: string;
  order_statuses?: string[];
}

interface ConnectFormValues {
  storeName: string;
  url: string;
  apiKey: string;
  orderStatuses: Record<string, boolean>;
}

const defaultOrderStatuses = {
  "pending": false,
  "processing": true,
  "complete": true,
  "closed": false,
  "canceled": false,
  "holded": false
};

const Connect = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { 
    step, 
    syncProgress, 
    syncStatus, 
    connecting, 
    setConnecting, 
    startSyncProcess, 
    resetSyncProcess 
  } = useSyncProcess();
  
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreConnection | null>(null);
  const [deletingStore, setDeletingStore] = useState(false);
  
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

    // Log hele resultatet for at identificere problemet
    console.log("Raw connection data:", connectionsData);

    // Filtrer forbindelser væk hvor store_id er null
    const validConnections = connectionsData.filter(
      (conn) => conn.store_id !== null
    );

    console.log("Filtered connections:", validConnections);
    setConnections(validConnections);
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

  
  const handleConnect = async (values: ConnectFormValues) => {
    if (!values.url.trim() || !values.apiKey.trim() || !values.storeName.trim()) {
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
      // Show immediate feedback
      toast.success("Forbinder til din Magento-butik. Dette kan tage et øjeblik...");
      
      // The function now returns just the store_id string
      const storeId = await addMagentoConnection(
        user.id,
        values.url,
        values.apiKey,
        values.storeName
      );
      
      // Show success message
      toast.success("Forbindelse oprettet! Starter synkronisering af data...");
      
      // Pass the storeId to startSyncProcess
      startSyncProcess(storeId);
      
      // We'll call loadConnections after sync completes in step 3
      
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
  
  const handleFinish = () => {
    resetSyncProcess();
    loadConnections();
  };

  const handleDisconnect = (connection: StoreConnection) => {
    setStoreToDelete(connection);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete || !storeToDelete.store_id) return;

    console.log("Deleting full store data via RPC for store ID:", storeToDelete.store_id);
    setDeletingStore(true);

    try {
      const { data, error } = await supabase.rpc("delete_store_data", {
        target_store_id: storeToDelete.store_id,
      });

      if (error) {
        console.error("Error in delete_store_data RPC:", error);
        throw error;
      }

      console.log("RPC deletion successful:", data);

      setConnections((prev) =>
        prev.filter((conn) => conn.store_id !== storeToDelete.store_id)
      );

      toast({
        title: t.connect.storeDeleted,
        description: t.connect.storeDeletedDesc,
      });
    } catch (error) {
      toast({
        title: t.connect.deleteError,
        description: t.connect.deleteErrorDesc,
        variant: "destructive",
      });
    } finally {
      setDeletingStore(false);
      setShowDeleteDialog(false);
      setStoreToDelete(null);
    }
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
            <ConnectionsList 
              connections={connections}
              loadingConnections={loadingConnections}
              onDisconnect={handleDisconnect}
            />
          </TabsContent>
          
          <TabsContent value="new">
            {step === 1 && (
              <ConnectionForm 
                onSubmit={handleConnect}
                connecting={connecting}
                defaultOrderStatuses={defaultOrderStatuses}
              />
            )}

            {step === 2 && (
              <SyncProgress 
                syncStatus={syncStatus}
                syncProgress={syncProgress}
              />
            )}

            {step === 3 && (
              <ConnectionComplete
                onReset={handleFinish}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConnectionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        storeToDelete={storeToDelete}
        onConfirmDelete={confirmDelete}
        isDeleting={deletingStore}
      />
    </Layout>
  );
};

export default Connect;
