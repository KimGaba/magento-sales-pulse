
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { toast } from 'sonner';
import { MagentoConnection } from '@/types/magento';
import ConnectionStatusCard from './ConnectionStatusCard';
import NoConnectionsCard from './NoConnectionsCard';
import StoreSelector from './StoreSelector';
import SyncStatus from '../connect/SyncStatus';

const IntegrationStatusSection = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  useEffect(() => {
    // Set the first connection's store_id as selected by default
    if (connections.length > 0 && !selectedStore) {
      setSelectedStore(connections[0].store_id || null);
    }
  }, [connections]);
  
  const loadConnections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      
      // Filter out connections without store_id
      const validConnections = connectionsData.filter(
        (conn) => conn.store_id !== null
      );
      
      setConnections(validConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Der opstod en fejl ved indlæsning af integrationer");
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualSync = async () => {
    if (!selectedStore) return;
    
    setSyncing(true);
    try {
      await triggerMagentoSync(selectedStore);
      toast.success("Synkronisering er igangsat. Det kan tage et par minutter at fuldføre.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error triggering sync:", error);
      toast.error("Der opstod en fejl ved start af synkronisering.");
    } finally {
      setSyncing(false);
    }
  };
  
  const handleFetchChanges = async () => {
    if (!selectedStore) return;
    
    setFetchingChanges(true);
    toast.success("Starter synkronisering af ændringer - vi henter dine data...");
    
    try {
      await triggerMagentoSync(selectedStore);
      toast.success("Henter ændringer fra din butik. Dette vil blive opdateret om et øjeblik.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error fetching changes:", error);
      toast.error("Der opstod en fejl ved hentning af ændringer.");
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

      {/* Connection selection for sync status */}
      {connections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Synkroniseringsstatus</h3>
          
          <StoreSelector 
            connections={connections}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
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
