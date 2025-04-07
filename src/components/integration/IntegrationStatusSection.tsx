
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { fetchMagentoConnections, triggerMagentoSync } from '@/services/magentoService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, RefreshCw, Clock, Download, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const IntegrationStatusSection = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  const loadConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Der opstod en fejl ved indlæsning af dine forbindelser.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await triggerMagentoSync('full', useMockData);
      toast.success("Synkronisering er igangsat. Det kan tage et par minutter at fuldføre.");
      
      // Refresh connections after a short delay to show updated status
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
    setFetchingChanges(true);
    try {
      await triggerMagentoSync('changes_only', useMockData);
      toast.success("Henter ændringer fra din butik. Dette vil blive opdateret om et øjeblik.");
      
      // Refresh connections after a short delay to show updated status
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
  
  const getStatusIndicator = (status: string) => {
    if (status === 'active') {
      return <CircleCheck className="h-6 w-6 text-green-500" />;
    } else if (status === 'error') {
      return <CircleX className="h-6 w-6 text-red-500" />;
    } else {
      return <Clock className="h-6 w-6 text-amber-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    if (status === 'active') {
      return "Aktiv";
    } else if (status === 'error') {
      return "Fejl";
    } else {
      return "Afventer";
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
          <Button 
            onClick={handleManualSync} 
            size="sm" 
            disabled={syncing}
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
              <div>
                <h3 className="font-medium">{connection.store_name}</h3>
                <p className="text-sm text-gray-500">{connection.store_url}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIndicator(connection.status)}
                <span>{getStatusText(connection.status)}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Testtilstand</span>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id="useMockData"
              checked={useMockData}
              onCheckedChange={setUseMockData}
            />
            <Label htmlFor="useMockData" className="text-sm text-gray-600">
              Brug testdata {useMockData ? '(aktiveret)' : '(deaktiveret)'}
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Aktivér denne indstilling for at teste integrationen med genereret data i stedet for at kalde Magento API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationStatusSection;
