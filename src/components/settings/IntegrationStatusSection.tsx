
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, Clock, Download } from 'lucide-react';
import SyncStatus from '../connect/SyncStatus';
import ConnectionsList from './ConnectionsList';

interface IntegrationStatusSectionProps {
  showFullSyncButton?: boolean;
}

const IntegrationStatusSection: React.FC<IntegrationStatusSectionProps> = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  const handleFetchChanges = async () => {
    setFetchingChanges(true);
    toast.success("Starter synkronisering af ændringer - vi henter dine data...");
    
    try {
      await triggerMagentoSync('changes_only', false);
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aktuel status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (connections.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aktuel status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Ingen Magento butikker forbundet</p>
            <Button variant="outline" onClick={() => window.location.href = "/connect"}>
              Forbind en butik
            </Button>
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
              disabled={fetchingChanges}
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
          </div>
        </CardHeader>
        <CardContent>
          <ConnectionsList connections={connections} />
        </CardContent>
      </Card>

      {/* Connection selection for sync status */}
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
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                {connections.map(connection => (
                  <option key={connection.id} value={connection.store_id || ''}>
                    {connection.store_name}
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
