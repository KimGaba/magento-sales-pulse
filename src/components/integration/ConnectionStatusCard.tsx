
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MagentoConnection } from '@/types/magento';
import { CircleCheck, CircleX, RefreshCw, Clock, Download } from 'lucide-react';

export interface ConnectionStatusCardProps {
  connection: MagentoConnection;
  isSelected: boolean;
  onSelect: () => void;
  onSyncChanges: () => void;
  onSyncAll: () => void;
  isLoading: boolean;
  syncProgress: any;
}

const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  connection,
  isSelected,
  onSelect,
  onSyncChanges,
  onSyncAll,
  isLoading,
  syncProgress
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

  // Format the last updated date if it exists
  const formatLastUpdated = (date: string | null) => {
    if (!date) return 'Aldrig synkroniseret';
    return new Date(date).toLocaleString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate sync progress percentage
  const getSyncProgressPercentage = () => {
    if (!syncProgress || !syncProgress.total_orders) return 0;
    return Math.min(
      Math.round((syncProgress.orders_processed / syncProgress.total_orders) * 100),
      100
    );
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'border-2 border-blue-500' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{connection.store_name}</CardTitle>
        <div className="flex items-center gap-2">
          {getStatusIndicator(connection.status)}
          <span>{getStatusText(connection.status)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">{connection.store_url}</p>
            <p className="text-sm text-gray-500">
              Sidst opdateret: {formatLastUpdated(connection.updated_at)}
            </p>
          </div>
          
          {isSelected && (
            <>
              {syncProgress && syncProgress.status === 'in_progress' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${getSyncProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Synkroniserer... {syncProgress.orders_processed} af {syncProgress.total_orders} ordrer
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncChanges();
                  }} 
                  size="sm" 
                  variant="outline"
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Kun ændringer</span>
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncAll();
                  }} 
                  size="sm" 
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Fuld synkronisering</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusCard;
