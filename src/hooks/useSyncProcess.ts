
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchSyncProgress, SyncProgress } from '@/services/transactionService';

interface SyncState {
  products: 'waiting' | 'syncing' | 'completed';
  orders: 'waiting' | 'syncing' | 'completed';
  customers: 'waiting' | 'syncing' | 'completed';
  statistics: 'waiting' | 'syncing' | 'completed';
}

export const useSyncProcess = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [syncProgress, setSyncProgress] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isInitialConnection, setIsInitialConnection] = useState(false);
  const [realSyncProgress, setRealSyncProgress] = useState<SyncProgress | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncState>({
    products: 'waiting',
    orders: 'waiting',
    customers: 'waiting',
    statistics: 'waiting'
  });

  // Poll for real sync progress if we have a storeId or connectionId
  useEffect(() => {
    if ((storeId || connectionId) && step === 2) {
      const interval = setInterval(async () => {
        try {
          let progress = null;
          
          // If we have a storeId, use it directly
          if (storeId) {
            progress = await fetchSyncProgress(storeId);
          } 
          // If this is an initial connection, we need to check if the store_id has been assigned
          else if (connectionId && isInitialConnection) {
            // First try to get the connection to see if it has a store_id now
            const { data: connection } = await supabase
              .from('magento_connections')
              .select('store_id')
              .eq('id', connectionId)
              .maybeSingle();
            
            if (connection && connection.store_id) {
              // Store ID has been assigned, save it and use it for future queries
              setStoreId(connection.store_id);
              progress = await fetchSyncProgress(connection.store_id);
            } else {
              // Try to get progress using connection_id directly
              const { data } = await supabase
                .from('sync_progress')
                .select('*')
                .eq('connection_id', connectionId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (data) {
                progress = data;
              }
            }
          }
          
          if (progress) {
            setRealSyncProgress(progress);
            
            // If sync is completed, move to step 3
            if (progress.status === 'completed') {
              setTimeout(() => {
                setStep(3);
              }, 1000);
            }
            
            // Calculate visual progress based on real progress
            if (progress.total_orders > 0) {
              const percentage = Math.min(
                Math.round((progress.orders_processed / progress.total_orders) * 100),
                100
              );
              setSyncProgress(percentage);
              
              // Update the sync status based on progress
              if (percentage > 0 && percentage < 30) {
                updateSyncStatus('products', 'completed');
                updateSyncStatus('orders', 'syncing');
              } else if (percentage >= 30 && percentage < 60) {
                updateSyncStatus('products', 'completed');
                updateSyncStatus('orders', 'completed');
                updateSyncStatus('customers', 'syncing');
              } else if (percentage >= 60 && percentage < 90) {
                updateSyncStatus('products', 'completed');
                updateSyncStatus('orders', 'completed');
                updateSyncStatus('customers', 'completed');
                updateSyncStatus('statistics', 'syncing');
              } else if (percentage >= 90) {
                updateSyncStatus('products', 'completed');
                updateSyncStatus('orders', 'completed');
                updateSyncStatus('customers', 'completed');
                updateSyncStatus('statistics', 'completed');
              }
            }
          }
        } catch (error) {
          console.error('Error polling sync progress:', error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [storeId, connectionId, step, isInitialConnection]);

  const updateSyncStatus = (item: keyof SyncState, status: 'waiting' | 'syncing' | 'completed') => {
    setSyncStatus(prev => ({
      ...prev,
      [item]: status
    }));
  };

  const triggerInitialSync = async (id: string, isConnection = false) => {
    try {
      const body = isConnection 
        ? { trigger: 'initial_connection', connection_id: id }
        : { trigger: 'initial_connection', store_id: id };
        
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body
      });
      
      if (error) {
        console.error("Error triggering initial sync:", error);
      } else {
        console.log("Initial sync triggered:", data);
      }
    } catch (err) {
      console.error("Failed to trigger sync:", err);
    }
  };

  const startSyncProcess = (id: string, isConnection = false) => {
    setStep(2);
    
    if (isConnection) {
      setConnectionId(id);
      setIsInitialConnection(true);
    } else {
      setStoreId(id);
    }
    
    toast({
      title: "Forbindelse oprettet!",
      description: "Din Magento-butik blev forbundet med succes. Starter synkronisering...",
    });
    
    // Begin with a visual indicator right away
    updateSyncStatus('products', 'syncing');
    setSyncProgress(5);
    
    triggerInitialSync(id, isConnection);
  };

  const resetSyncProcess = () => {
    setStep(1);
    setSyncProgress(0);
    setStoreId(null);
    setConnectionId(null);
    setIsInitialConnection(false);
    setRealSyncProgress(null);
    setSyncStatus({
      products: 'waiting',
      orders: 'waiting',
      customers: 'waiting',
      statistics: 'waiting'
    });
    setConnecting(false);
  };

  return {
    step,
    syncProgress,
    syncStatus,
    connecting,
    storeId,
    connectionId,
    realSyncProgress,
    setStep,
    setConnecting,
    startSyncProcess,
    resetSyncProcess
  };
};
