
import { supabase } from '@/integrations/supabase/client';

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
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId);
    
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
 * Adds a new Magento connection
 */
export const addMagentoConnection = async (connection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'>): Promise<MagentoConnection> => {
  try {
    const { data, error } = await supabase
      .from('magento_connections')
      .insert(connection)
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
export const triggerMagentoSync = async (storeId: string): Promise<void> => {
  try {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would call a Supabase Edge Function or similar
    console.log(`Triggering Magento sync for store ${storeId}`);
    
    // Simulate a successful sync trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return;
  } catch (error) {
    console.error('Error triggering Magento sync:', error);
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
    
    // This should be replaced with an actual query to the database
    // to get all unique order statuses across all orders
    const { data: transactions } = await supabase
      .from('transactions')
      .select('metadata')
      .not('metadata', 'is', null);
    
    // Extract unique statuses from transaction metadata
    const statusSet = new Set<string>();
    
    // Add common statuses by default
    commonStatuses.forEach(status => statusSet.add(status));
    
    // Add any found in transactions
    if (transactions && transactions.length > 0) {
      transactions.forEach(transaction => {
        try {
          // Try to safely access the status from metadata
          const metadata = transaction.metadata as any;
          if (metadata && metadata.status && typeof metadata.status === 'string') {
            statusSet.add(metadata.status);
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
