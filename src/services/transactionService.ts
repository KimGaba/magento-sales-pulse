
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
    
    // Use the database function directly with proper typing
    const { data, error } = await supabase
      .rpc('get_sync_progress', { store_id_param: storeId });
    
    if (error) {
      console.error('Error fetching sync progress:', error);
      throw error;
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('Found sync progress:', data[0]);
      return data[0] as SyncProgress;
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
