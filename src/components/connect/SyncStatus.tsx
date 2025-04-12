
import React, { useState, useEffect } from 'react';
import { fetchSyncProgress, SyncProgress } from '@/services/transactionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import EdgeFunctionUnavailable from './EdgeFunctionUnavailable';

interface SyncStatusProps {
  storeId: string;
  onRefresh?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ storeId, onRefresh }) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edgeFunctionError, setEdgeFunctionError] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadSyncProgress();
    }
  }, [storeId]);

  const loadSyncProgress = async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    setEdgeFunctionError(false);

    try {
      const progress = await fetchSyncProgress(storeId);
      setSyncProgress(progress);
    } catch (error) {
      console.error('Error fetching sync progress:', error);
      
      if (error instanceof Error && error.message.includes('Edge Function')) {
        setEdgeFunctionError(true);
      } else {
        setError('Kunne ikke hente synkroniseringsstatus');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSyncProgress();
      
      if (onRefresh) {
        onRefresh();
      }
      
      toast.success('Synkroniseringsstatus opdateret');
    } catch (error) {
      toast.error('Kunne ikke opdatere synkroniseringsstatus');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="my-6">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (edgeFunctionError) {
    return <EdgeFunctionUnavailable />;
  }

  if (error) {
    return (
      <Card className="my-6 border-red-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncProgress) {
    return (
      <Card className="my-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center p-8">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen nylig synkronisering fundet</h3>
            <p className="text-gray-500 mb-4">Synkronisering køres automatisk efter forbindelse af butik eller når der hentes ændringer</p>
            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Opdaterer...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tjek igen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = syncProgress.status === 'completed';
  const isInProgress = syncProgress.status === 'in_progress';
  const hasError = syncProgress.status === 'error';
  
  const progressPercentage = syncProgress.total_orders 
    ? Math.min(Math.round((syncProgress.orders_processed / syncProgress.total_orders) * 100), 100) 
    : 0;

  return (
    <Card className="my-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seneste synkronisering</CardTitle>
        <Button onClick={handleRefresh} size="sm" variant="outline" disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Opdaterer...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Opdater
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <div className="flex items-center">
              {isCompleted && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-600">Fuldført</span>
                </>
              )}
              {isInProgress && (
                <>
                  <Clock className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-amber-600">I gang</span>
                </>
              )}
              {hasError && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-600">Fejl</span>
                </>
              )}
            </div>
          </div>
          
          {syncProgress.total_orders > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fremskridt:</span>
                <span>{progressPercentage}% ({syncProgress.orders_processed} af {syncProgress.total_orders} ordrer)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${hasError ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Startet:</span>
              <div>{new Date(syncProgress.started_at).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-500">Sidst opdateret:</span>
              <div>{new Date(syncProgress.updated_at).toLocaleString()}</div>
            </div>
          </div>
          
          {hasError && syncProgress.error_message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <strong>Fejlbesked:</strong> {syncProgress.error_message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatus;
