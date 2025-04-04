
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchMagentoConnections } from '@/services/magentoService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MagentoConnection } from '@/types/magento';

interface MagentoConnectionSettingsProps {
  userId: string;
}

const MagentoConnectionSettings: React.FC<MagentoConnectionSettingsProps> = ({ userId }) => {
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  
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
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Der opstod en fejl ved indlæsning af dine forbindelser.");
    } finally {
      setLoadingConnections(false);
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MagentoConnectionSettings;
