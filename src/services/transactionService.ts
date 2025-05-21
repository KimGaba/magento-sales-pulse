
import { supabase } from '@/integrations/supabase/client';
import { SyncProgress, Transaction } from '@/types/database';

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
): Promise<Transaction[]> => {
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
    
    // Transform the data to match the Transaction type
    const transformedData: Transaction[] = (data || []).map(item => {
      // Extract email from metadata if available
      let email = '';
      if (item.metadata && typeof item.metadata === 'object') {
        const meta = item.metadata as Record<string, any>;
        if (meta.customer_email) {
          email = meta.customer_email.toString();
        }
      }
      
      // Check if customer_id might contain an email
      if (!email && item.customer_id && typeof item.customer_id === 'string' && item.customer_id.includes('@')) {
        email = item.customer_id;
      }
      
      return {
        id: item.id,
        store_id: item.store_id,
        transaction_date: item.transaction_date,
        amount: item.amount,
        created_at: item.created_at,
        product_id: item.product_id || null,
        customer_id: item.customer_id || null,
        external_id: item.external_id || null,
        metadata: item.metadata || {}, // Using 'any' type as defined in Transaction interface
        email: email, // Set email from extracted value
        customer_name: item.customer_name || null
      };
    });
    
    return transformedData;
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
        
        // Transform to ensure it has all required SyncProgress fields
        return {
          id: data.progress.id,
          store_id: data.progress.store_id,
          connection_id: data.progress.connection_id,
          current_page: data.progress.current_page,
          total_pages: data.progress.total_pages,
          orders_processed: data.progress.orders_processed,
          total_orders: data.progress.total_orders, 
          status: data.progress.status as 'in_progress' | 'completed' | 'error' | 'failed',
          started_at: data.progress.started_at,
          updated_at: data.progress.updated_at,
          error_message: data.progress.error_message,
          // Add missing properties with defaults if not present
          skipped_orders: data.progress.skipped_orders || 0,
          warning_message: data.progress.warning_message || undefined,
          notes: data.progress.notes
        };
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
    
    // Type cast to ensure all fields are included
    if (data) {
      return {
        id: data.id,
        store_id: data.store_id,
        connection_id: data.connection_id,
        current_page: data.current_page,
        total_pages: data.total_pages,
        orders_processed: data.orders_processed,
        total_orders: data.total_orders,
        status: data.status as 'in_progress' | 'completed' | 'error' | 'failed',
        started_at: data.started_at,
        updated_at: data.updated_at,
        error_message: data.error_message,
        // Add missing properties with defaults if not present in the database response
        skipped_orders: (data as any).skipped_orders || 0,
        warning_message: (data as any).warning_message,
        notes: data.notes
      };
    }
    return null;
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
    
    // Ensure all items have the correct status type and fields
    const history = data.map(item => ({
      id: item.id,
      store_id: item.store_id,
      connection_id: item.connection_id,
      current_page: item.current_page,
      total_pages: item.total_pages,
      orders_processed: item.orders_processed,
      total_orders: item.total_orders,
      status: (item.status === 'in_progress' || item.status === 'completed' || item.status === 'error' || item.status === 'failed') 
        ? item.status as 'in_progress' | 'completed' | 'error' | 'failed'
        : 'in_progress', // Default to in_progress if unknown status
      started_at: item.started_at,
      updated_at: item.updated_at,
      error_message: item.error_message,
      // Add missing properties with defaults if not present
      skipped_orders: (item as any).skipped_orders || 0,
      warning_message: (item as any).warning_message,
      notes: item.notes
    }));
    
    return history;
  } catch (error) {
    console.error('Error in fetchSyncHistory:', error);
    return [];
  }
};
