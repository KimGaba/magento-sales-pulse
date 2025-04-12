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
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  useEffect(() => {
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
    
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      
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
  
  const handleFullSync = async () => {
    if (!selectedStore) {
      toast.error("Ingen butik valgt. Vælg venligst en butik først.");
      return;
    }
    
    setSyncing(true);
    try {
      console.log('Triggering full sync for store ID:', selectedStore);
      const result = await triggerMagentoSync(selectedStore);
      console.log('Sync result:', result);
      
      toast.success("Synkronisering er igangsat. Det kan tage et par minutter at fuldføre.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error triggering sync:", error);
      toast.error(`Der opstod en fejl ved start af synkronisering: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
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
    
    try {
      console.log('Fetching changes for store ID:', selectedStore);
      const result = await triggerMagentoSync(selectedStore);
      console.log('Fetch changes result:', result);
      
      toast.success("Henter ændringer fra din butik. Dette vil blive opdateret om et øjeblik.");
      
      setTimeout(() => {
        loadConnections();
      }, 3000);
    } catch (error) {
      console.error("Error fetching changes:", error);
      toast.error(`Der opstod en fejl ved hentning af ændringer: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
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
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
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
              disabled={fetchingChanges || !selectedStore}
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
                disabled={syncing || !selectedStore}
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
            loadingConnections={false}
          />
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
                value={selectedStore || ''}
                onChange={(e) => {
                  console.log('Store selected:', e.target.value);
                  setSelectedStore(e.target.value);
                }}
              >
                {connections.map(connection => (
                  <option key={connection.id} value={connection.store_id || ''}>
                    {connection.store_name} {!connection.store_id && '(Mangler store ID)'}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
