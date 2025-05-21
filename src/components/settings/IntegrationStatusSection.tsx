
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, Clock, Download, RefreshCw } from 'lucide-react';
import SyncStatus from '../connect/SyncStatus';
import ConnectionsList from './ConnectionsList';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntegrationStatusSectionProps {
  showFullSyncButton?: boolean;
}

const IntegrationStatusSection: React.FC<IntegrationStatusSectionProps> = ({ showFullSyncButton = true }) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  useEffect(() => {
    if (connections.length > 0 && !selectedConnection) {
      // Prioriter forbindelser med store_id, men tag den første forbindelse hvis ingen har store_id
      const connectionWithStoreId = connections.find(conn => conn.store_id);
      const firstConnection = connections[0];
      
      if (connectionWithStoreId) {
        console.log('Vælger forbindelse med store_id:', connectionWithStoreId.id);
        setSelectedConnection(connectionWithStoreId.store_id as string);
      } else if (firstConnection) {
        console.log('Ingen forbindelser med store_id fundet, bruger connection_id i stedet:', firstConnection.id);
        setSelectedConnection(firstConnection.id);
      } else {
        console.warn('Ingen forbindelser fundet');
      }
    }
  }, [connections]);
  
  const loadConnections = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      
      if (connectionsData.length > 0) {
        setConnections(connectionsData);
        
        // Tjek om der er nogen forbindelser med gyldigt store_id
        const hasValidStoreId = connectionsData.some(conn => conn.store_id);
        
        if (!hasValidStoreId) {
          setError('Du har forbindelser, men ingen har et gyldigt store_id. Prøv at trykke på "Synkroniser nu" for at starte en synkronisering.');
        }
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError('Der opstod en fejl ved indlæsning af integrationer');
      toast.error("Der opstod en fejl ved indlæsning af integrationer");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFullSync = async () => {
    if (!selectedConnection) {
      toast.error("Ingen forbindelse valgt. Vælg venligst en forbindelse først.");
      return;
    }
    
    setSyncing(true);
    try {
      console.log('Trigger sync for connection/store ID:', selectedConnection);
      
      // Afgør om dette er et store_id eller connection_id
      const selectedConn = connections.find(c => c.store_id === selectedConnection || c.id === selectedConnection);
      
      if (!selectedConn) {
        throw new Error('Valgt forbindelse ikke fundet');
      }
      
      const idToUse = selectedConn.store_id || selectedConn.id;
      const isConnectionId = !selectedConn.store_id;
      
      console.log(`Using ${isConnectionId ? 'connection_id' : 'store_id'}: ${idToUse}`);
      
      const result = await triggerMagentoSync(idToUse, false, isConnectionId);
      console.log('Sync result:', result);
      
      toast.success("Synkronisering er igangsat. Det kan tage et par minutter at fuldføre.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error triggering sync:", error);
      
      // Specific error handling for edge function connection errors
      if (error instanceof Error && error.message.includes('Edge Function')) {
        toast.error(error.message);
      } else {
        toast.error(`Der opstod en fejl ved start af synkronisering: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
      }
    } finally {
      setSyncing(false);
    }
  };
  
  const handleFetchChanges = async () => {
    if (!selectedConnection) {
      toast.error("Ingen forbindelse valgt. Vælg venligst en forbindelse først.");
      return;
    }
    
    setFetchingChanges(true);
    
    try {
      // Afgør om dette er et store_id eller connection_id
      const selectedConn = connections.find(c => c.store_id === selectedConnection || c.id === selectedConnection);
      
      if (!selectedConn) {
        throw new Error('Valgt forbindelse ikke fundet');
      }
      
      const idToUse = selectedConn.store_id || selectedConn.id;
      const isConnectionId = !selectedConn.store_id;
      
      console.log(`Fetching changes for ${isConnectionId ? 'connection_id' : 'store_id'}: ${idToUse}`);
      
      const result = await triggerMagentoSync(idToUse, true, isConnectionId);
      console.log('Fetch changes result:', result);
      
      toast.success("Henter ændringer fra din butik. Dette vil blive opdateret om et øjeblik.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error fetching changes:", error);
      
      // Specific error handling for edge function connection errors
      if (error instanceof Error && error.message.includes('Edge Function')) {
        toast.error(error.message);
      } else {
        toast.error(`Der opstod en fejl ved hentning af ændringer: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
      }
    } finally {
      setFetchingChanges(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Ingen forbindelser fundet</h3>
            <p className="text-gray-500">Du har endnu ikke forbundet nogen Magento-butikker.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Aktuel status</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleFetchChanges} 
              size="sm" 
              variant="outline"
              disabled={fetchingChanges || !selectedConnection}
              className="flex items-center gap-1"
            >
              {fetchingChanges ? (
                <>
                  <Download className="h-4 w-4 animate-spin" />
                  <span>Henter ændringer...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Hent ændringer</span>
                </>
              )}
            </Button>
            
            {showFullSyncButton && (
              <Button 
                onClick={handleFullSync} 
                size="sm" 
                disabled={syncing || !selectedConnection}
                className="flex items-center gap-1"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synkroniserer...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Synkroniser nu</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ConnectionsList 
            connections={connections}
            loadingConnections={loading}
          />
          
          {error && (
            <Alert variant="warning" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {connections.length > 0 && (
        <div>
          {connections.length > 1 && (
            <div className="mb-4">
              <label htmlFor="storeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Vælg butik
              </label>
              <select
                id="storeSelect"
                className="border border-gray-300 rounded-md w-full p-2"
                value={selectedConnection || ''}
                onChange={(e) => {
                  console.log('Store/connection selected:', e.target.value);
                  setSelectedConnection(e.target.value);
                }}
              >
                {connections.map(connection => {
                  const label = connection.store_name + (connection.store_id ? '' : ' (Mangler store ID)');
                  const value = connection.store_id || connection.id;
                  return (
                    <option key={connection.id} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          {selectedConnection && (
            <SyncStatus 
              storeId={selectedConnection} 
              onRefresh={loadConnections}
              onStartSync={handleFullSync}
              onRestartSync={handleFullSync}
            />
          )}
        </div>
      )}
    </>
  );
};

export default IntegrationStatusSection;
