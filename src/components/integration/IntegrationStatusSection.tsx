
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { toast } from 'sonner';
import { MagentoConnection } from '@/types/magento';
import ConnectionStatusCard from './ConnectionStatusCard';
import NoConnectionsCard from './NoConnectionsCard';
import StoreSelector from './StoreSelector';
import SyncStatus from '../connect/SyncStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EdgeFunctionUnavailable from '../connect/EdgeFunctionUnavailable';

const IntegrationStatusSection = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edgeFunctionError, setEdgeFunctionError] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  useEffect(() => {
    // Set the first connection's store_id as selected by default
    if (connections.length > 0 && !selectedStore) {
      const firstValidStore = connections.find(conn => conn.store_id)?.store_id || null;
      if (firstValidStore) {
        console.log('Setting default selected store:', firstValidStore);
        setSelectedStore(firstValidStore);
      } else {
        console.warn('No valid store_id found in connections');
      }
    }
  }, [connections]);
  
  const loadConnections = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setEdgeFunctionError(false);
    
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      
      // Filter out connections without store_id
      const validConnections = connectionsData.filter(
        (conn) => conn.store_id !== null
      );
      
      if (validConnections.length === 0 && connectionsData.length > 0) {
        setError('Du har forbindelser, men ingen har et gyldigt store_id');
      }
      
      setConnections(validConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError('Der opstod en fejl ved indlæsning af integrationer');
      toast.error("Der opstod en fejl ved indlæsning af integrationer");
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualSync = async () => {
    if (!selectedStore) {
      toast.error("Ingen butik valgt. Vælg venligst en butik først.");
      return;
    }
    
    setSyncing(true);
    setEdgeFunctionError(false);
    
    try {
      console.log('Triggering full sync for store ID:', selectedStore);
      
      // Show immediate feedback to user
      toast.info("Starter synkronisering...", {
        duration: 2000,
      });
      
      const result = await triggerMagentoSync(selectedStore);
      console.log('Sync result:', result);
      
      toast.success("Synkronisering er igangsat. Det kan tage et par minutter at fuldføre.");
      
      // Refresh the connections list after a delay
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error triggering sync:", error);
      
      // Specific error handling for edge function connection errors
      if (error instanceof Error && error.message.includes('Edge Function')) {
        toast.error(error.message);
        setEdgeFunctionError(true);
      } else {
        toast.error(`Der opstod en fejl ved start af synkronisering: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
      }
    } finally {
      setSyncing(false);
    }
  };
  
  const handleFetchChanges = async () => {
    if (!selectedStore) {
      toast.error("Ingen butik valgt. Vælg venligst en butik først.");
      return;
    }
    
    setFetchingChanges(true);
    setEdgeFunctionError(false);
    
    try {
      console.log('Fetching changes for store ID:', selectedStore);
      
      // Show immediate feedback to user
      toast.info("Starter hentning af ændringer...", {
        duration: 2000,
      });
      
      const result = await triggerMagentoSync(selectedStore, true); // Pass true for changes_only
      console.log('Fetch changes result:', result);
      
      toast.success("Henter ændringer fra din butik. Dette vil blive opdateret om et øjeblik.");
      
      // Refresh the connections list after a delay
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error fetching changes:", error);
      
      // Specific error handling for edge function connection errors
      if (error instanceof Error && error.message.includes('Edge Function')) {
        toast.error(error.message);
        setEdgeFunctionError(true);
      } else {
        toast.error(`Der opstod en fejl ved hentning af ændringer: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
      }
    } finally {
      setFetchingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (connections.length === 0) {
    return <NoConnectionsCard />;
  }
  
  return (
    <>
      <ConnectionStatusCard 
        connections={connections}
        handleFetchChanges={handleFetchChanges}
        handleManualSync={handleManualSync}
        syncing={syncing}
        fetchingChanges={fetchingChanges}
      />

      {edgeFunctionError && <EdgeFunctionUnavailable />}

      {/* Connection selection for sync status */}
      {connections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Synkroniseringsstatus</h3>
          
          <StoreSelector 
            connections={connections}
            selectedStore={selectedStore}
            onSelectStore={(storeId) => {
              console.log('Store selected from selector:', storeId);
              setSelectedStore(storeId);
            }}
          />
          
          {selectedStore && (
            <SyncStatus 
              storeId={selectedStore} 
              onRefresh={loadConnections}
            />
          )}
        </div>
      )}
    </>
  );
};

export default IntegrationStatusSection;
