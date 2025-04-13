
import React, { useState } from 'react';
import { CircleCheck, CircleX, Clock, Database, EyeOff, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
  onDisconnect?: (connection: StoreConnection) => void;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({ 
  connections, 
  loadingConnections, 
  onDisconnect 
}) => {
  const [showInactive, setShowInactive] = useState(false);
  
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

  // Filter connections based on showInactive setting
  const filteredConnections = showInactive 
    ? connections 
    : connections.filter(conn => conn.status === 'active');

  if (loadingConnections) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="w-6 h-6 rounded-full border-2 border-magento-600 border-t-transparent animate-spin mr-2"></div>
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
  
  // Check if there are any inactive connections
  const hasInactiveConnections = connections.some(conn => conn.status !== 'active');

  return (
    <div>
      {/* Show toggle only if there are inactive connections */}
      {hasInactiveConnections && (
        <div className="flex justify-end items-center mb-4">
          <span className="text-sm text-gray-500 mr-2">
            {showInactive ? 'Vis alle forbindelser' : 'Vis kun aktive forbindelser'}
          </span>
          <Switch 
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          {showInactive ? <Eye size={16} className="ml-2 text-gray-500" /> : <EyeOff size={16} className="ml-2 text-gray-500" />}
        </div>
      )}
      
      <div className="space-y-4">
        {filteredConnections.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Ingen {showInactive ? '' : 'aktive '}forbindelser at vise.</p>
            {!showInactive && hasInactiveConnections && (
              <Button 
                variant="link" 
                className="mt-2 text-sm"
                onClick={() => setShowInactive(true)}
              >
                <Eye size={16} className="mr-1" />
                Vis inaktive forbindelser
              </Button>
            )}
          </div>
        ) : (
          filteredConnections.map((connection) => (
            <Card key={connection.id} className="border-l-4 border-l-magento-600">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{connection.store_name}</h3>
                    <p className="text-sm text-gray-500">{connection.store_url}</p>
                    <div className="flex items-center mt-2">
                      <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                        connection.status === 'active' ? 'bg-green-500' : connection.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></span>
                      <span className="text-sm">
                        {getStatusText(connection.status)}
                      </span>
                    </div>
                    {connection.order_statuses && connection.order_statuses.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Synkroniserer ordrer med status: </span>
                        <span className="font-medium">{connection.order_statuses.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  {onDisconnect && (
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => onDisconnect(connection)}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Slet butik
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ConnectionsList;
