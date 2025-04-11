
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface BasketOpenerProduct {
  product_id: string;
  product_name: string;
  opener_count: number;
  total_appearances: number;
  opener_score: number;
}

export interface SyncProgress {
  id: string;
  store_id: string;
  connection_id: string;
  current_page: number;
  total_pages: number | null;
  orders_processed: number;
  total_orders: number | null;
  started_at: string;
  updated_at: string;
  status: 'in_progress' | 'completed' | 'error';
  error_message: string | null;
}

/**
 * Tests basic connectivity to the database
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  }
};

/**
 * Gets the total count of transactions
 */
export const getTransactionCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting transactions:', error);
    throw error;
  }
};

/**
 * Fetches basket opener products within a date range with additional filtering
 */
export const fetchBasketOpenerProducts = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = [],
  storeView?: string,
  customerGroup?: string,
  orderStatuses?: string[]
): Promise<BasketOpenerProduct[]> => {
  try {
    console.log(`Fetching basket opener products from ${fromDate} to ${toDate}`);
    console.log(`Store IDs filter:`, storeIds);
    console.log(`Store view filter: ${storeView || 'all'}`);
    console.log(`Customer group filter: ${customerGroup || 'all'}`);
    console.log(`Order status filter:`, orderStatuses || 'all');
    
    // Use a database function to get basket opener products
    const { data, error } = await supabase.rpc('get_basket_opener_products', {
      start_date: fromDate,
      end_date: toDate,
      store_filter: storeIds.length > 0 ? storeIds : null
    });
    
    if (error) {
      console.error('Error fetching basket opener products:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in fetchBasketOpenerProducts:', error);
    throw error;
  }
};

/**
 * Fetches transaction data within a date range
 */
export const fetchTransactionData = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = [],
  storeView?: string,
  customerGroup?: string,
  orderStatuses?: string[]
) => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate}`);
    
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    // Apply store filter if provided
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    // Apply order status filter if provided
    if (orderStatuses && orderStatuses.length > 0) {
      // Filter based on metadata->status field
      // Note: Using a more reliable filter approach
      let statusFilters = orderStatuses.map(status => 
        `metadata->>'status' = '${status}'`
      ).join(' OR ');
      
      query = query.or(statusFilters);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchTransactionData:', error);
    throw error;
  }
};

/**
 * Fetches the sync progress for a store
 */
export const fetchSyncProgress = async (storeId: string): Promise<SyncProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('sync_progress')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, which is fine
        return null;
      }
      console.error('Error fetching sync progress:', error);
      throw error;
    }
    
    // Ensure the status is one of the allowed values
    const progress: SyncProgress = {
      ...data,
      status: (data.status === 'in_progress' || data.status === 'completed' || data.status === 'error') 
        ? data.status as 'in_progress' | 'completed' | 'error'
        : 'in_progress' // Default to in_progress if unknown status
    };
    
    return progress;
  } catch (error) {
    console.error('Error in fetchSyncProgress:', error);
    return null;
  }
};

/**
 * Fetches the sync history for a store
 */
export const fetchSyncHistory = async (storeId: string, limit = 5): Promise<SyncProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('sync_progress')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching sync history:', error);
      throw error;
    }
    
    // Ensure all items have the correct status type
    const history: SyncProgress[] = (data || []).map(item => ({
      ...item,
      status: (item.status === 'in_progress' || item.status === 'completed' || item.status === 'error') 
        ? item.status as 'in_progress' | 'completed' | 'error'
        : 'in_progress' // Default to in_progress if unknown status
    }));
    
    return history;
  } catch (error) {
    console.error('Error in fetchSyncHistory:', error);
    return [];
  }
};
