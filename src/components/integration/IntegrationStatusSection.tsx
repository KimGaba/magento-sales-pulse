
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveMagentoConnections, fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { fetchSyncProgress } from '@/services/transactionService';
import { NoConnectionsCard } from '@/components/integration/NoConnectionsCard';
import { ConnectionStatusCard } from '@/components/integration/ConnectionStatusCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const IntegrationStatusSection = () => {
  const { user } = useAuth();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all connections
  const { 
    data: allConnections = [],
    isLoading: allConnectionsLoading,
    error: allConnectionsError,
    refetch: refetchAllConnections
  } = useQuery({
    queryKey: ['magento-connections', user?.id],
    queryFn: () => user?.id ? fetchMagentoConnections(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // Fetch only active connections
  const { 
    data: activeConnections = [],
    isLoading: activeConnectionsLoading,
    error: activeConnectionsError,
    refetch: refetchActiveConnections
  } = useQuery({
    queryKey: ['active-magento-connections', user?.id],
    queryFn: () => user?.id ? fetchActiveMagentoConnections(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // Get the appropriate connections list based on the toggle
  const connectionsToShow = showAllConnections ? allConnections : activeConnections;
  const isConnectionsLoading = showAllConnections ? allConnectionsLoading : activeConnectionsLoading;
  const connectionsError = showAllConnections ? allConnectionsError : activeConnectionsError;

  // Set the first connection as selected when connections are loaded, if none is selected
  useEffect(() => {
    if (connectionsToShow.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connectionsToShow[0].id);
    }
  }, [connectionsToShow, selectedConnectionId]);

  // Get the selected connection object
  const selectedConnection = connectionsToShow.find(conn => conn.id === selectedConnectionId);
  
  // Refresh data
  const refreshData = () => {
    refetchActiveConnections();
    refetchAllConnections();
    // Also refetch sync progress if needed
  };

  // Handle sync start
  const handleStartSync = async (changesOnly = false) => {
    if (!selectedConnection || !selectedConnection.store_id) {
      toast.error("Ingen butik valgt til synkronisering");
      return;
    }
    
    setIsSyncing(true);
    try {
      // Show toast notification that sync is starting
      toast.info(changesOnly ? "Starter synkronisering af ændringer..." : "Starter fuld synkronisering...");
      
      // Trigger sync
      await triggerMagentoSync(selectedConnection.store_id, changesOnly);
      
      // Show success message
      toast.success("Synkronisering startet");
      
      // Refresh data after a slight delay to show updated status
      setTimeout(() => {
        refreshData();
      }, 2000);
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(`Fejl: ${error.message || 'Der opstod en fejl ved synkronisering'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check current sync status
  const { data: syncProgress } = useQuery({
    queryKey: ['sync-progress', selectedConnection?.store_id],
    queryFn: () => selectedConnection?.store_id ? fetchSyncProgress(selectedConnection.store_id) : Promise.resolve(null),
    enabled: !!selectedConnection?.store_id,
    refetchInterval: syncProgress?.status === 'in_progress' ? 5000 : false,
  });

  const syncInProgress = syncProgress?.status === 'in_progress';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Integration Status</h2>
        
        {connectionsToShow.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-all" 
                checked={showAllConnections} 
                onCheckedChange={setShowAllConnections}
              />
              <Label htmlFor="show-all">Vis alle forbindelser</Label>
            </div>
            
            <Button 
              onClick={() => handleStartSync(true)} 
              disabled={isSyncing || syncInProgress || !selectedConnection?.store_id} 
              variant="outline"
              size="sm"
            >
              {(isSyncing || syncInProgress) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hent ændringer
            </Button>
            
            <Button 
              onClick={() => handleStartSync(false)} 
              disabled={isSyncing || syncInProgress || !selectedConnection?.store_id}
              size="sm"
            >
              {(isSyncing || syncInProgress) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Synkronisér nu
            </Button>
          </div>
        )}
      </div>

      {isConnectionsLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-magento-600" />
        </div>
      ) : connectionsError ? (
        <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
          Der opstod en fejl ved hentning af forbindelser
        </div>
      ) : connectionsToShow.length === 0 ? (
        <NoConnectionsCard />
      ) : (
        <div>
          <ConnectionStatusCard 
            connections={connectionsToShow}
            selectedConnectionId={selectedConnectionId}
            onConnectionSelect={setSelectedConnectionId}
            onRefresh={refreshData}
            onStartSync={() => handleStartSync(false)}
            onFetchChanges={() => handleStartSync(true)}
          />
        </div>
      )}
    </div>
  );
};

export default IntegrationStatusSection;
