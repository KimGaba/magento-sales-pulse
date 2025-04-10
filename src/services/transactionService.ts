
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';

/**
 * Tests basic database connectivity to Supabase
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing database connection...');
    
    // Just check if we can reach Supabase with a simple query
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test succeeded');
    return true;
  } catch (error) {
    console.error('Exception in database connection test:', error);
    return false;
  }
};

/**
 * Gets the count of transactions
 */
export const getTransactionCount = async (): Promise<number> => {
  try {
    console.log('Getting transaction count...');
    
    // Use count parameter instead of selecting a specific column with count
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting transaction count:', error);
      throw error;
    }
    
    console.log(`Found ${count} transactions`);
    return count || 0;
  } catch (error) {
    console.error('Exception in getTransactionCount:', error);
    throw error;
  }
};

/**
 * Fetches transaction data within a date range
 */
export const fetchTransactionData = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = []
): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate}`);
    
    let query = supabase
      .from('transactions')
      .select(`
        id,
        store_id,
        amount,
        transaction_date,
        customer_id,
        external_id,
        created_at,
        product_id,
        metadata
      `)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    // Apply store_id filter if needed
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering by store IDs:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query.order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
    
    // Convert the data to match the Transaction type by ensuring metadata is properly typed
    const transactions: Transaction[] = data?.map(item => ({
      ...item,
      metadata: item.metadata as Transaction['metadata'] // Type assertion to ensure compatibility
    })) || [];
    
    return transactions;
  } catch (error) {
    console.error('Exception in fetchTransactionData:', error);
    throw error;
  }
};

/**
 * Fetches transaction data for specific stores within a date range
 * This is a more explicit version of the function that always includes store filtering
 */
export const fetchStoreTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[]
): Promise<Transaction[]> => {
  return fetchTransactionData(fromDate, toDate, storeIds);
};

/**
 * Interface for basket opener products
 */
export interface BasketOpenerProduct {
  product_id: string;
  product_name: string;
  opener_count: number;
  total_appearances: number;
  opener_score: number;
}

/**
 * Fetches basket opener products within a date range
 */
export const fetchBasketOpenerProducts = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = [],
  customerGroup: string = 'alle'
): Promise<BasketOpenerProduct[]> => {
  try {
    console.log(`Fetching basket opener products from ${fromDate} to ${toDate}`);
    console.log(`Store IDs filter:`, storeIds);
    console.log(`Customer group filter: ${customerGroup}`);
    
    // Using the rpc function we created in the database
    // Fix: Create a properly typed params object that matches the expected type
    const params: { 
      start_date: string; 
      end_date: string; 
      store_filter?: string[];
      customer_group?: string;
    } = { 
      start_date: fromDate, 
      end_date: toDate,
      store_filter: storeIds.length > 0 ? storeIds : undefined
    };
    
    // Add customer_group parameter if not 'alle'
    if (customerGroup !== 'alle') {
      params.customer_group = customerGroup;
    }
    
    console.log('RPC params:', params);
    
    const { data, error } = await supabase
      .rpc('get_basket_opener_products', params);
    
    if (error) {
      console.error('Error fetching basket opener products:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} basket opener products`);
    
    // Add more detailed logging for debugging
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('First few basket opener products:', data.slice(0, 3));
    } else {
      console.log('No basket opener products found matching the criteria');
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Exception in fetchBasketOpenerProducts:', error);
    throw error;
  }
};

/**
 * Interface for sync progress information
 */
export interface SyncProgress {
  id?: string;
  store_id: string;
  connection_id: string;
  current_page: number;
  total_pages: number;
  orders_processed: number;
  total_orders: number;
  status: 'in_progress' | 'completed' | 'error';
  started_at: string;
  updated_at: string;
  error_message?: string;
}

/**
 * Fetches the current sync progress for a store
 */
export const fetchSyncProgress = async (storeId: string): Promise<SyncProgress | null> => {
  try {
    console.log(`Fetching sync progress for store ${storeId}`);
    
    // Use a type assertion with unknown first to avoid type errors
    // This is safe because we validate the structure before returning
    const { data, error } = await supabase
      .from('sync_progress' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching sync progress:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      const progressData = data[0];
      
      // Validate that the returned data has the expected structure
      if (progressData && 
          'store_id' in progressData && 
          'connection_id' in progressData &&
          'current_page' in progressData &&
          'status' in progressData) {
        console.log('Found sync progress:', progressData);
        return progressData as unknown as SyncProgress;
      } else {
        console.warn('Retrieved data does not match SyncProgress structure:', progressData);
        return null;
      }
    }
    
    console.log('No sync progress found');
    return null;
  } catch (error) {
    console.error('Exception in fetchSyncProgress:', error);
    return null;
  }
};

/**
 * Directly calls the magento-sync edge function to get the latest progress
 */
export const getSyncProgressFromEdgeFunction = async (storeId: string): Promise<SyncProgress | null> => {
  try {
    console.log(`Getting sync progress from edge function for store ${storeId}`);
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: {
        action: 'get_sync_progress',
        storeId
      }
    });
    
    if (error) {
      console.error('Error calling getSyncProgress edge function:', error);
      throw error;
    }
    
    if (data?.success && data?.progress) {
      console.log('Received sync progress from edge function:', data.progress);
      return data.progress as SyncProgress;
    }
    
    console.log('No sync progress found from edge function');
    return null;
  } catch (error) {
    console.error('Exception in getSyncProgressFromEdgeFunction:', error);
    return null;
  }
};

/**
 * Interface for sync history item
 */
export interface SyncHistoryItem {
  id: string;
  timestamp: string;
  end_timestamp?: string;
  status: 'success' | 'error' | 'in_progress';
  items_synced: number;
  duration_seconds?: number;
  trigger_type: 'manual' | 'scheduled' | 'initial';
  store_id: string;
  store_name?: string;
}

/**
 * Fetches synchronization history for the last 7 days
 * Currently returns mock data, will be updated to use actual API
 */
export const fetchSyncHistory = async (): Promise<SyncHistoryItem[]> => {
  try {
    console.log('Fetching sync history for the last 7 days');
    
    // This is temporary mock data
    // TODO: Replace with actual API call when available
    const now = new Date();
    const history: SyncHistoryItem[] = [];
    
    // Generate some realistic mock data
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(now);
      startDate.setHours(startDate.getHours() - (i * 8));
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + Math.floor(Math.random() * 30) + 5);
      
      const syncedItems = Math.floor(Math.random() * 150) + 50;
      const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      const triggerTypes: ('manual' | 'scheduled' | 'initial')[] = ['scheduled', 'initial', 'scheduled', 'scheduled', 'manual'];
      
      history.push({
        id: `sync-${i}`,
        timestamp: startDate.toISOString(),
        end_timestamp: endDate.toISOString(),
        status: Math.random() > 0.2 ? 'success' : 'error',
        items_synced: syncedItems,
        duration_seconds: durationSeconds,
        trigger_type: triggerTypes[i],
        store_id: 'store-' + i,
        store_name: 'Store ' + (i + 1)
      });
    }
    
    // Add one in-progress sync
    if (Math.random() > 0.5) {
      const inProgressDate = new Date(now);
      inProgressDate.setMinutes(inProgressDate.getMinutes() - 3);
      
      history.unshift({
        id: 'sync-in-progress',
        timestamp: inProgressDate.toISOString(),
        status: 'in_progress',
        items_synced: Math.floor(Math.random() * 30) + 10,
        trigger_type: 'scheduled',
        store_id: 'store-current',
        store_name: 'Current Store'
      });
    }
    
    return history;
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return [];
  }
};
