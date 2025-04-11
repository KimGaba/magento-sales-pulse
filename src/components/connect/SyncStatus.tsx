
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { fetchSyncProgress, SyncProgress } from '@/services/transactionService';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';

interface SyncStatusProps {
  storeId: string;
  onRefresh?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ storeId, onRefresh }) => {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  useEffect(() => {
    if (storeId) {
      loadProgress();
      
      // Set up periodic refresh if the sync is in progress
      const interval = setInterval(() => {
        if (progress?.status === 'in_progress') {
          loadProgress();
        }
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [storeId, progress?.status]);
  
  const loadProgress = async () => {
    try {
      setLoading(true);
      const syncProgress = await fetchSyncProgress(storeId);
      
      if (syncProgress) {
        setProgress(syncProgress);
        
        // Update the "last updated" time
        if (syncProgress.updated_at) {
          try {
            const updated = new Date(syncProgress.updated_at);
            setLastUpdate(formatDistance(updated, new Date(), { addSuffix: true }));
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading sync progress:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadProgress();
    if (onRefresh) onRefresh();
  };
  
  // Calculate progress percentage
  const calculateProgressPercentage = () => {
    if (!progress || !progress.total_orders || progress.total_orders <= 0) {
      return 0;
    }
    
    const percentage = (progress.orders_processed / progress.total_orders) * 100;
    return Math.min(Math.round(percentage), 100); // Ensure it doesn't exceed 100%
  };
  
  if (loading && !progress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Synkroniseringsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!progress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Synkroniseringsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Clock className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500">Ingen nylig synkronisering fundet</p>
            <p className="text-sm text-gray-400 text-center">
              Synkronisering køres automatisk efter forbindelse af en butik eller når der hentes ændringer
            </p>
            {onRefresh && (
              <Button variant="outline" onClick={handleRefresh} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Opdatér status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const progressPercentage = calculateProgressPercentage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Synkroniseringsstatus</CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Opdatér status</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            {progress.status === 'in_progress' && (
              <div className="w-8 h-8 rounded-full border-2 border-magento-600 border-t-transparent animate-spin"></div>
            )}
            {progress.status === 'completed' && (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            {progress.status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
            
            <div>
              <h3 className="font-medium">
                {progress.status === 'in_progress' && 'Synkronisering i gang'}
                {progress.status === 'completed' && 'Synkronisering fuldført'}
                {progress.status === 'error' && 'Synkronisering fejlede'}
              </h3>
              <p className="text-sm text-gray-500">
                {lastUpdate && `Opdateret ${lastUpdate}`}
              </p>
            </div>
          </div>
          
          {progress.status === 'in_progress' && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Behandler side {progress.current_page} af {progress.total_pages || '?'}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Ordrer behandlet</p>
                  <p className="font-medium">{progress.orders_processed} af {progress.total_orders || '?'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Startet</p>
                  <p className="font-medium">
                    {progress.started_at ? new Date(progress.started_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </>
          )}
          
          {progress.status === 'completed' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ordrer behandlet</p>
                <p className="font-medium">{progress.orders_processed}</p>
              </div>
              <div>
                <p className="text-gray-500">Fuldført</p>
                <p className="font-medium">
                  {progress.updated_at ? new Date(progress.updated_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
          
          {progress.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">
                {progress.error_message || 'Der opstod en fejl under synkroniseringen'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleRefresh}
              >
                Prøv igen
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatus;
