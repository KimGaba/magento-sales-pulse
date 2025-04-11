
import React from 'react';
import { MagentoConnection } from '@/types/magento';

interface StoreSelectorProps {
  connections: MagentoConnection[];
  selectedStore: string | null;
  onSelectStore: (storeId: string) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ 
  connections, 
  selectedStore, 
  onSelectStore 
}) => {
  if (connections.length <= 1) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <label htmlFor="storeSelect" className="block text-sm font-medium text-gray-700 mb-1">
        Vælg butik
      </label>
      <select
        id="storeSelect"
        className="border border-gray-300 rounded-md w-full p-2"
        value={selectedStore || ''}
        onChange={(e) => onSelectStore(e.target.value)}
      >
        {connections.map(connection => (
          <option key={connection.id} value={connection.store_id || ''}>
            {connection.store_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StoreSelector;
