
import { supabase } from '@/integrations/supabase/client';
import { SyncProgress } from '@/types/sync';

// Type definitions
export interface BasketOpenerProduct {
  product_id: string;
  product_name: string;
  opener_count: number;
  total_appearances: number;
  opener_score: number;
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
    
    // Ensure we return an array of BasketOpenerProduct, even if empty
    return data ? data as BasketOpenerProduct[] : [];
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
    console.log(`Fetching sync progress for store: ${storeId}`);
    
    // First try to use the Edge Function to get more detailed progress
    try {
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { 
          action: 'get_sync_progress',
          storeId: storeId
        }
      });
      
      if (error) {
        console.error('Error invoking Edge Function for sync progress:', error);
        
        // Special handling for Edge Function connection errors
        if (error.message && error.message.includes('Failed to send a request to the Edge Function')) {
          throw new Error('Der opstod en fejl ved forbindelse til Edge Function. Dette kan skyldes, at du kører i et udviklingsmiljø.');
        }
        
        throw error;
      }
      
      if (data && data.success && data.progress) {
        console.log('Sync progress from Edge Function:', data.progress);
        return data.progress as SyncProgress;
      }
    } catch (edgeFunctionError) {
      console.error('Edge Function error:', edgeFunctionError);
      
      // If it's not the special Edge Function error, rethrow it
      if (!(edgeFunctionError instanceof Error && edgeFunctionError.message.includes('Edge Function'))) {
        // Fall through to database query
        console.log('Falling back to database query for sync progress');
      } else {
        // Rethrow the Edge Function error
        throw edgeFunctionError;
      }
    }
    
    // Fallback: query the sync_progress table directly
    const { data, error } = await supabase
      .from('sync_progress')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found (single row expected)
        console.log('No sync progress found in database');
        return null;
      }
      
      console.error('Error fetching sync progress from database:', error);
      throw error;
    }
    
    console.log('Sync progress from database:', data);
    return data as unknown as SyncProgress;
  } catch (error) {
    console.error('Error in fetchSyncProgress:', error);
    throw error;
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
    
    // Make sure we get back a properly typed array
    if (!data) {
      return [];
    }
    
    // Ensure all items have the correct status type
    const history = data.map(item => ({
      ...item,
      id: item.id as string,
      store_id: item.store_id as string,
      connection_id: item.connection_id as string,
      current_page: item.current_page as number,
      total_pages: item.total_pages as number | null,
      orders_processed: item.orders_processed as number,
      total_orders: item.total_orders as number | null,
      status: (item.status === 'in_progress' || item.status === 'completed' || item.status === 'error' || item.status === 'failed') 
        ? item.status as 'in_progress' | 'completed' | 'error' | 'failed'
        : 'in_progress', // Default to in_progress if unknown status
      started_at: item.started_at as string,
      updated_at: item.updated_at as string,
      error_message: item.error_message as string | undefined,
      skipped_orders: item.skipped_orders as number | undefined,
      warning_message: item.warning_message as string | undefined,
      notes: item.notes as string | undefined
    }));
    
    return history;
  } catch (error) {
    console.error('Error in fetchSyncHistory:', error);
    return [];
  }
};
