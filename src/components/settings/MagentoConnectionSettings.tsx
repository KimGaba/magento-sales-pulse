
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchMagentoConnections, updateMagentoConnection } from '@/services/magentoService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MagentoConnection } from '@/types/magento';

interface MagentoConnectionSettingsProps {
  userId: string;
}

const MagentoConnectionSettings: React.FC<MagentoConnectionSettingsProps> = ({ userId }) => {
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectionOrderStatuses, setConnectionOrderStatuses] = useState<Record<string, Record<string, boolean>>>({});
  
  const allOrderStatuses = [
    "pending",
    "processing",
    "complete",
    "closed",
    "canceled",
    "holded"
  ];
  
  useEffect(() => {
    if (userId) {
      loadMagentoConnections();
    }
  }, [userId]);

  const loadMagentoConnections = async () => {
    setLoadingConnections(true);
    try {
      const connectionsData = await fetchMagentoConnections(userId);
      setConnections(connectionsData);
      
      // Initialize connection order statuses
      const statusesObj = {};
      connectionsData.forEach(connection => {
        const currentStatuses = connection.order_statuses || [];
        statusesObj[connection.id] = {};
        
        allOrderStatuses.forEach(status => {
          statusesObj[connection.id][status] = currentStatuses.includes(status);
        });
      });
      
      setConnectionOrderStatuses(statusesObj);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Der opstod en fejl ved indlæsning af dine forbindelser.");
    } finally {
      setLoadingConnections(false);
    }
  };
  
  const handleStatusChange = (connectionId: string, status: string, checked: boolean) => {
    setConnectionOrderStatuses(prev => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        [status]: checked
      }
    }));
  };
  
  const saveConnectionSettings = async (connectionId: string) => {
    const selectedStatuses = Object.entries(connectionOrderStatuses[connectionId] || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([status]) => status);
      
    try {
      await updateMagentoConnection(connectionId, { order_statuses: selectedStatuses });
      
      toast.success("Ordre-statusindstillinger gemt");
      
      // Reload connections to get updated data
      await loadMagentoConnections();
    } catch (error) {
      console.error("Error saving connection settings:", error);
      toast.error("Fejl ved gemning af indstillinger");
    }
  };

  if (connections.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Magento forbindelser</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {connections.map(connection => (
            <div key={connection.id} className="space-y-4 pb-4 border-b last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="font-medium">{connection.store_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs w-fit ${
                  connection.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {connection.status === 'active' ? 'Aktiv' : 'Afventer'}
                </span>
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Ordre-statuser der skal synkroniseres</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allOrderStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${connection.id}-${status}`}
                        checked={connectionOrderStatuses[connection.id]?.[status] || false}
                        onCheckedChange={(checked) => 
                          handleStatusChange(connection.id, status, !!checked)
                        }
                      />
                      <label 
                        htmlFor={`${connection.id}-${status}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed 
                          peer-disabled:opacity-70 capitalize"
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                type="button" 
                size="sm"
                onClick={() => saveConnectionSettings(connection.id)}
              >
                Gem indstillinger
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MagentoConnectionSettings;
