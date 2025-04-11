
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SyncStatus {
  products: string;
  orders: string;
  customers: string;
  statistics: string;
}

interface SyncProgressProps {
  syncStatus: SyncStatus;
  syncProgress: number;
}

const SyncProgress: React.FC<SyncProgressProps> = ({ syncStatus, syncProgress }) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Database className="h-12 w-12 text-magento-600" />
        </div>
        <CardTitle>Synkroniserer data</CardTitle>
        <CardDescription>
          Vi henter dine butiksdata. Dette kan tage et par minutter...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Produkter</span>
            {syncStatus.products === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : syncStatus.products === 'syncing' ? (
              <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
            ) : (
              <span className="text-gray-400">Venter...</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span>Ordrer</span>
            {syncStatus.orders === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : syncStatus.orders === 'syncing' ? (
              <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
            ) : (
              <span className="text-gray-400">Venter...</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span>Kunder</span>
            {syncStatus.customers === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : syncStatus.customers === 'syncing' ? (
              <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
            ) : (
              <span className="text-gray-400">Venter...</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span>Salgsstatistikker</span>
            {syncStatus.statistics === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : syncStatus.statistics === 'syncing' ? (
              <div className="w-5 h-5 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
            ) : (
              <span className="text-gray-400">Venter...</span>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Progress value={syncProgress} className="h-2.5" />
        </div>
        <p className="text-center mt-2 text-sm">{syncProgress}% fuldført</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Synkronisering kører automatisk og du vil blive notificeret når vi er færdige
        </p>
      </CardFooter>
    </Card>
  );
};

export default SyncProgress;
