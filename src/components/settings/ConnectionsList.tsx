
import React from 'react';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, Clock } from 'lucide-react';

interface ConnectionsListProps {
  connections: MagentoConnection[];
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({ connections }) => {
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
  );
};

export default ConnectionsList;
