
import React, { useState, useEffect } from 'react';
import { fetchSyncProgress } from '@/services/transactionService';
import { SyncProgress } from '@/types/sync';
import { Button } from "@/components/ui/button"
import { RefreshCcw, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner";

interface SyncStatusProps {
  storeId: string | null;
  onRefresh: () => void;
  onStartSync?: () => void;
  onRestartSync?: () => void;
}

const SyncStatus = ({ storeId, onRefresh, onStartSync, onRestartSync }: SyncStatusProps) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadSyncStatus(storeId);
    } else {
      setSyncProgress(null);
    }
  }, [storeId]);

  // Set up auto-refresh when sync is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (syncProgress?.status === 'in_progress' && storeId) {
      setAutoRefreshActive(true);
      interval = setInterval(() => {
        loadSyncStatus(storeId);
      }, 3000); // Refresh more frequently - every 3 seconds
    } else {
      setAutoRefreshActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncProgress?.status, storeId]);

  const loadSyncStatus = async (storeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const progress = await fetchSyncProgress(storeId);
      setSyncProgress(progress);
    } catch (error: any) {
      console.error("Error fetching sync status:", error);
      setError(error.message || 'Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (storeId) {
      loadSyncStatus(storeId);
      onRefresh();
    }
  };
  
  const handleStartNewSync = () => {
    if (storeId) {
      toast.info("Starter ny synkronisering...");
      if (onStartSync) {
        onStartSync();
      }
      // Refresh status after a short delay to show updated state
      setTimeout(() => {
        loadSyncStatus(storeId);
        onRefresh();
      }, 1000); // Faster refresh
    }
  };
  
  const handleRestartSync = () => {
    if (storeId) {
      toast.info("Genstarter synkronisering...");
      if (onRestartSync) {
        onRestartSync();
      }
      // Refresh status after a short delay to show updated state
      setTimeout(() => {
        loadSyncStatus(storeId);
        onRefresh();
      }, 1000); // Faster refresh
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProgressPercentage = () => {
    if (!syncProgress || !syncProgress.total_orders) return 0;
    return (syncProgress.orders_processed / syncProgress.total_orders) * 100;
  };
  
  return (
    <div className="mt-4 bg-white rounded-lg border p-4 shadow-sm">
      {loading && !syncProgress ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            className="mt-2"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Prøv igen
          </Button>
        </div>
      ) : !syncProgress ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Ingen synkroniseringsstatus tilgængelig.</p>
          <p className="text-sm text-gray-400 mt-1">
            Start en synkronisering for at se status her.
          </p>
          {onStartSync && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleStartNewSync} 
              className="mt-3"
            >
              <Play className="h-4 w-4 mr-2" />
              Start synkronisering nu
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center">
              Synkroniseringsstatus
              {syncProgress.status === 'in_progress' && (
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {autoRefreshActive && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
                  I gang
                </Badge>
              )}
              {syncProgress.status === 'completed' && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-600">
                  Gennemført
                </Badge>
              )}
              {syncProgress.status === 'error' || syncProgress.status === 'failed' && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-600">
                  Fejl
                </Badge>
              )}
            </h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              title="Opdatér status"
              className="animate-pulse"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress information */}
          {syncProgress.status === 'in_progress' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Fremskridt</span>
                {syncProgress.total_orders && (
                  <span>
                    {syncProgress.orders_processed} / {syncProgress.total_orders} ordrer
                  </span>
                )}
              </div>
              <Progress 
                value={calculateProgressPercentage()} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {calculateProgressPercentage().toFixed(0)}% fuldført
              </p>
            </div>
          )}
          
          {/* Warning about skipped orders */}
          {syncProgress.skipped_orders && syncProgress.skipped_orders > 0 && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bemærk</AlertTitle>
              <AlertDescription>
                {syncProgress.skipped_orders} ordrer blev sprunget over.
                {syncProgress.warning_message && (
                  <p className="mt-1 text-sm">{syncProgress.warning_message}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error message */}
          {(syncProgress.error_message || syncProgress.status === 'failed' || syncProgress.status === 'error') && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fejl opstået</AlertTitle>
              <AlertDescription>
                {syncProgress.error_message || 'Synkronisering fejlede af ukendt årsag'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Notes field if available */}
          {syncProgress.notes && (
            <Alert className="mb-4">
              <AlertDescription>
                {syncProgress.notes}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Sync details */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Start tidspunkt</h4>
              <p>{formatDateTime(syncProgress.started_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Senest opdateret</h4>
              <p>{formatDateTime(syncProgress.updated_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nuværende side</h4>
              <p>{syncProgress.current_page}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Antal sider i alt</h4>
              <p>{syncProgress.total_pages || 'Ukendt'}</p>
            </div>
          </div>
          
          {/* Sync actions */}
          <div className="mt-6 flex justify-end space-x-2">
            {(syncProgress.status === 'completed' || syncProgress.status === 'failed' || syncProgress.status === 'error') && onStartSync && (
              <Button onClick={handleStartNewSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start ny synkronisering
              </Button>
            )}
            {(syncProgress.status === 'error' || syncProgress.status === 'failed') && onRestartSync && (
              <Button onClick={handleRestartSync} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Genstart synkronisering
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
