
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    products: 'waiting',
    orders: 'waiting',
    customers: 'waiting',
    statistics: 'waiting'
  });

  const updateSyncStatus = (item: keyof SyncStatus, status: 'waiting' | 'syncing' | 'completed') => {
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

  const startSyncProcess = () => {
    setStep(2);
    
    toast({
      title: "Forbindelse oprettet!",
      description: "Din Magento-butik blev forbundet med succes. Starter synkronisering...",
    });
    
    updateSyncStatus('products', 'syncing');
    setSyncProgress(10);
    
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
  };

  const resetSyncProcess = () => {
    setStep(1);
    setSyncProgress(0);
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
    setConnecting,
    startSyncProcess,
    resetSyncProcess
  };
};
