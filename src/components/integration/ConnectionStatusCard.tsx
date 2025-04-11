
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, RefreshCw, Clock, Download } from 'lucide-react';

interface ConnectionStatusCardProps {
  connections: MagentoConnection[];
  handleFetchChanges: () => void;
  handleManualSync: () => void;
  syncing: boolean;
  fetchingChanges: boolean;
}

const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  connections,
  handleFetchChanges,
  handleManualSync,
  syncing,
  fetchingChanges
}) => {
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
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusCard;
