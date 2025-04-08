
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
      await addMagentoConnection(
        user.id,
        values.url,
        values.apiKey,
        values.storeName
      );
      
      startSyncProcess();
      
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
    if (!storeToDelete) return;
    
    setDeletingStore(true);

    try {
      // First delete store data with all related records
      if (storeToDelete.store_id) {
        console.log(`Deleting store data for store ID: ${storeToDelete.store_id}`);
        const { data, error } = await supabase.rpc('delete_store_data', {
          target_store_id: storeToDelete.store_id
        });

        if (error) {
          console.error("Error deleting store data:", error);
          throw error;
        }
        console.log("Store data deletion successful:", data);
      }

      // Then delete the connection itself
      console.log(`Deleting connection with ID: ${storeToDelete.id}`);
      const { error } = await supabase
        .from('magento_connections')
        .delete()
        .eq('id', storeToDelete.id);

      if (error) {
        console.error("Error deleting connection:", error);
        throw error;
      }

      console.log("Connection deleted successfully");

      // Update the connections list by removing the deleted connection
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.id !== storeToDelete.id)
      );

      toast({
        title: t.connect.storeDeleted,
        description: t.connect.storeDeletedDesc,
      });
      
      // Reload connections to ensure the UI is up to date
      setTimeout(() => {
        loadConnections();
      }, 500);
      
    } catch (error) {
      console.error("Error deleting store:", error);
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
