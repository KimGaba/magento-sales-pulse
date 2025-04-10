
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
      .select('transactions.id, transactions.store_id, transactions.amount, transactions.transaction_date, transactions.customer_id, transactions.external_id, transactions.created_at, transactions.product_id')
      .gte('transactions.transaction_date', fromDate)
      .lte('transactions.transaction_date', toDate);
    
    // Apply store_id filter if needed
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering by store IDs:', storeIds);
      query = query.in('transactions.store_id', storeIds);
    }
    
    const { data, error } = await query.order('transactions.transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
    return data || [];
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
    if (data && data.length > 0) {
      console.log('First few basket opener products:', data.slice(0, 3));
    } else {
      console.log('No basket opener products found matching the criteria');
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in fetchBasketOpenerProducts:', error);
    throw error;
  }
};
