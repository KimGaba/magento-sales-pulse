
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveMagentoConnections } from '@/services/magentoService';
import { useAuth } from '@/context/AuthContext';
import { triggerMagentoSync, fetchSyncProgress } from '@/services/supabase';
import { Button } from '../ui/button';
import NoConnectionsCard from '@/components/integration/NoConnectionsCard';
import ConnectionStatusCard from '@/components/integration/ConnectionStatusCard';
import { toast } from 'sonner';

const IntegrationStatusSection = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  
  const { data: connections, isLoading: isLoadingConnections, refetch: refetchConnections } = useQuery({
    queryKey: ['magento-connections', user?.id, activeOnly],
    queryFn: () => user?.id ? 
      fetchMagentoConnections(user.id, activeOnly) : 
      Promise.resolve([]),
    enabled: !!user?.id,
  });

  const fetchMagentoConnections = async (userId: string, onlyActive: boolean = true) => {
    try {
      if (onlyActive) {
        return await fetchActiveMagentoConnections(userId);
      } else {
        return await fetchActiveMagentoConnections(userId);
      }
    } catch (error) {
      console.error('Error fetching Magento connections:', error);
      return [];
    }
  };
  
  useEffect(() => {
    if (connections && connections.length > 0 && !selectedStoreId) {
      setSelectedStoreId(connections[0].store_id);
    }
  }, [connections, selectedStoreId]);
  
  useEffect(() => {
    const fetchProgress = async () => {
      if (selectedStoreId) {
        try {
          const progress = await fetchSyncProgress(selectedStoreId);
          setSyncProgress(progress);
        } catch (error) {
          console.error('Error fetching sync progress:', error);
        }
      }
    };
    
    fetchProgress();
    
    const intervalId = setInterval(fetchProgress, 5000);
    
    return () => clearInterval(intervalId);
  }, [selectedStoreId]);
  
  const handleSyncTrigger = async (storeId: string, changesOnly: boolean = true) => {
    if (!storeId) return;
    
    setIsLoading(true);
    try {
      await triggerMagentoSync(storeId, changesOnly);
      toast.success(changesOnly ? 
        'Henter ændringer fra Magento...' : 
        'Fuld synkronisering startet...');
      
      const progress = await fetchSyncProgress(storeId);
      setSyncProgress(progress);
      
      setTimeout(() => refetchConnections(), 2000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      
      // Display a more user-friendly error message
      let errorMessage = 'Synkronisering fejlede';
      
      if (error instanceof Error) {
        if (error.message.includes('Edge Function returned a non-2xx status code')) {
          errorMessage = 'Fejl i Magento-forbindelsen. Prøv igen senere eller kontakt support.';
        } else {
          errorMessage = `Synkronisering fejlede: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleActiveOnly = () => {
    setActiveOnly(!activeOnly);
  };
  
  if (isLoadingConnections) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Integration Status</h2>
        <p>Indlæser forbindelser...</p>
      </div>
    );
  }
  
  if (!connections || connections.length === 0) {
    return <NoConnectionsCard />;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Integration Status</h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-600">
            {activeOnly ? 'Viser aktive' : 'Viser alle'}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleActiveOnly}
            className="text-xs"
          >
            {activeOnly ? 'Vis alle' : 'Vis kun aktive'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {connections.map((connection) => (
          <ConnectionStatusCard 
            key={connection.id}
            connection={connection}
            isSelected={selectedStoreId === connection.store_id}
            onSelect={() => setSelectedStoreId(connection.store_id)}
            onSyncChanges={() => handleSyncTrigger(connection.store_id, true)}
            onSyncAll={() => handleSyncTrigger(connection.store_id, false)}
            isLoading={isLoading}
            syncProgress={syncProgress}
          />
        ))}
      </div>
    </div>
  );
};

export default IntegrationStatusSection;
