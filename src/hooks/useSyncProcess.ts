
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
  const [realSyncProgress, setRealSyncProgress] = useState<SyncProgress | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncState>({
    products: 'waiting',
    orders: 'waiting',
    customers: 'waiting',
    statistics: 'waiting'
  });

  // Poll for real sync progress if we have a storeId
  useEffect(() => {
    if (storeId && step === 2) {
      const interval = setInterval(async () => {
        try {
          const progress = await fetchSyncProgress(storeId);
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
  }, [storeId, step]);

  const updateSyncStatus = (item: keyof SyncState, status: 'waiting' | 'syncing' | 'completed') => {
    setSyncStatus(prev => ({
      ...prev,
      [item]: status
    }));
  };

  const triggerInitialSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { trigger: 'initial_connection' }
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

  const startSyncProcess = (newStoreId: string) => {
    setStep(2);
    setStoreId(newStoreId);
    
    toast({
      title: "Forbindelse oprettet!",
      description: "Din Magento-butik blev forbundet med succes. Starter synkronisering...",
    });
    
    // Begin with a visual indicator right away
    updateSyncStatus('products', 'syncing');
    setSyncProgress(5);
    
    // If we don't get real progress data, we'll use this fallback
    if (!realSyncProgress) {
      setTimeout(() => {
        updateSyncStatus('products', 'completed');
        updateSyncStatus('orders', 'syncing');
        setSyncProgress(30);
        
        setTimeout(() => {
          updateSyncStatus('orders', 'completed');
          updateSyncStatus('customers', 'syncing');
          setSyncProgress(60);
          
          setTimeout(() => {
            updateSyncStatus('customers', 'completed');
            updateSyncStatus('statistics', 'syncing');
            setSyncProgress(80);
            
            setTimeout(() => {
              updateSyncStatus('statistics', 'completed');
              setSyncProgress(100);
              
              triggerInitialSync();
              
              setTimeout(() => {
                setStep(3);
              }, 1000);
            }, 1000);
          }, 1500);
        }, 1500);
      }, 1500);
    } else {
      // If we have real progress data, we'll use that directly
      triggerInitialSync();
    }
  };

  const resetSyncProcess = () => {
    setStep(1);
    setSyncProgress(0);
    setStoreId(null);
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
    realSyncProgress,
    setStep, // Export setStep function to be used by components
    setConnecting,
    startSyncProcess,
    resetSyncProcess
  };
};
