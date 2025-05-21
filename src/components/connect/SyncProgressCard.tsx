import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncProgress } from '@/types/sync';

interface SyncProgressCardProps {
  syncProgress: number;
  syncStatus: {
    products: 'waiting' | 'syncing' | 'completed';
    orders: 'waiting' | 'syncing' | 'completed';
    customers: 'waiting' | 'syncing' | 'completed';
    statistics: 'waiting' | 'syncing' | 'completed';
  };
  realSyncProgress: SyncProgress | null;
}

const SyncProgressCard: React.FC<SyncProgressCardProps> = ({ 
  syncProgress, 
  syncStatus, 
  realSyncProgress 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Synkroniserer din butik</CardTitle>
        <CardDescription>
          Vi synkroniserer i øjeblikket dine Magento data. Dette kan tage et par minutter.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <p>
            {realSyncProgress ? (
              `Synkroniserer data: ${realSyncProgress.orders_processed} / ${realSyncProgress.total_orders || '?'}`
            ) : (
              `Synkroniserer data: ${syncProgress}%`
            )}
          </p>
          <progress className="w-full h-2 bg-gray-200 rounded" value={realSyncProgress ? (realSyncProgress.orders_processed / (realSyncProgress.total_orders || 1)) * 100 : syncProgress} max="100"></progress>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold">Produkter</p>
            <p className="text-xs">{syncStatus.products}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ordrer</p>
            <p className="text-xs">{syncStatus.orders}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Kunder</p>
            <p className="text-xs">{syncStatus.customers}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Statistikker</p>
            <p className="text-xs">{syncStatus.statistics}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncProgressCard;
