
import { supabase } from '@/integrations/railway/client';

export type MagentoConnection = {
  id: string;
  user_id: string;
  store_id: string | null;
  created_at: string;
  updated_at: string;
  store_url: string;
  store_name: string;
  access_token: string;
  status: string;
};

/**
 * Fetches Magento connections for a specific user
 */
export const fetchMagentoConnections = async (userId: string): Promise<MagentoConnection[]> => {
  try {
    // Add cache control headers to ensure we get fresh data
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching Magento connections:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchMagentoConnections:', error);
    throw error;
  }
};

/**
 * Fetches only active Magento connections for a specific user
 */
export const fetchActiveMagentoConnections = async (userId: string): Promise<MagentoConnection[]> => {
  try {
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active Magento connections:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchActiveMagentoConnections:', error);
    throw error;
  }
};

/**
 * Adds a new Magento connection
 */
export const addMagentoConnection = async (connection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'>): Promise<MagentoConnection> => {
  try {
    // Ensure store_id is null if not provided
    const connectionData = {
      ...connection,
      store_id: connection.store_id || null
    };
    
    const { data, error } = await supabase
      .from('magento_connections')
      .insert(connectionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding Magento connection:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in addMagentoConnection:', error);
    throw error;
  }
};

/**
 * Triggers a Magento synchronization for a specific store
 */
export const triggerMagentoSync = async (storeId: string, changesOnly = false): Promise<any> => {
  // Validate storeId
  if (!storeId || storeId.trim() === '') {
    console.error('Error triggering Magento sync: storeId is empty or undefined');
    throw new Error('Store ID is required for synchronization');
  }
  
  console.log(`Triggering Magento sync for store ${storeId}, changesOnly: ${changesOnly}`);
  
  try {
    // Call the Supabase Edge Function with the store ID and trigger type
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: { 
        store_id: storeId,
        trigger: 'manual_sync',
        syncType: changesOnly ? 'changes_only' : 'full',
        maxPages: 1000 // Set maximum pages to 1000 to support up to 100,000 orders
      }
    });
    
    if (error) {
      console.error('Error triggering Magento sync:', error);
      
      // Special handling for Edge Function connection errors
      if (error.message && error.message.includes('Failed to send a request to the Edge Function')) {
        throw new Error('Der opstod en fejl ved forbindelse til Edge Function. Dette kan skyldes, at du kører i et udviklingsmiljø.');
      }
      
      throw error;
    }
    
    console.log('Magento sync triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in triggerMagentoSync:', error);
    throw error;
  }
};

/**
 * Fetches order statuses from all connected Magento stores
 */
export const fetchOrderStatuses = async (): Promise<string[]> => {
  try {
    // For now, we'll return a static list of common Magento order statuses
    // In a real implementation, this would fetch from the database or Magento API
    const commonStatuses = [
      'pending', 
      'processing', 
      'complete', 
      'closed', 
      'canceled', 
      'holded', 
      'payment_review'
    ];
    
    // The following query retrieves transaction metadata so we can
    // derive the unique order statuses from all saved orders
    const { data: transactions } = await supabase
      .from('transactions')
      .select('metadata');
    
    // Extract unique statuses from transaction metadata
    const statusSet = new Set<string>(commonStatuses);
    
    if (transactions && transactions.length > 0) {
      transactions.forEach(transaction => {
        try {
          if (transaction.metadata && 
              typeof transaction.metadata === 'object' && 
              transaction.metadata !== null) {
            const metadata = transaction.metadata as Record<string, any>;
            if (metadata.status && typeof metadata.status === 'string') {
              statusSet.add(metadata.status);
            }
          }
        } catch (e) {
          // Ignore errors in individual transactions
        }
      });
    }
    
    return Array.from(statusSet);
  } catch (error) {
    console.error('Error fetching order statuses:', error);
    // Return default statuses in case of error
    return ['pending', 'processing', 'complete', 'canceled'];
  }
};
