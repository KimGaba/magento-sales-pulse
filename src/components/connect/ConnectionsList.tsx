
import React from 'react';
import { Database, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StoreConnection {
  id: string;
  store_id?: string;
  store_name: string;
  store_url: string;
  status: string;
  order_statuses?: string[];
}

interface ConnectionsListProps {
  connections: StoreConnection[];
  loadingConnections: boolean;
  onDisconnect: (connection: StoreConnection) => void;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({ 
  connections, 
  loadingConnections, 
  onDisconnect 
}) => {
  if (loadingConnections) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 rounded-full border-4 border-magento-600 border-t-transparent animate-spin mr-2"></div>
        <p>Indlæser forbindelser...</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="flex justify-center mb-4">
          <Database className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">Ingen forbindelser fundet</h3>
        <p className="text-gray-500">Du har endnu ikke forbundet nogen Magento-butikker.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map(connection => (
        <Card key={connection.id} className="border-l-4 border-l-magento-600">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{connection.store_name}</h3>
                <p className="text-sm text-gray-500">{connection.store_url}</p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                    connection.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></span>
                  <span className="text-sm">
                    {connection.status === 'active' ? 'Aktiv' : 'Afventer'}
                  </span>
                </div>
                {connection.order_statuses && connection.order_statuses.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span>Synkroniserer ordrer med status: </span>
                    <span className="font-medium">{connection.order_statuses.join(', ')}</span>
                  </div>
                )}
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => onDisconnect(connection)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Frakobl
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConnectionsList;
