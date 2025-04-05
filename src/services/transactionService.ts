
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
  toDate: string
): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate}`);
    
    // Use simple column names without table prefix
    const { data, error } = await supabase
      .from('transactions')
      .select('id, store_id, amount, transaction_date, customer_id, external_id, created_at, product_id')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate)
      .order('transaction_date', { ascending: false });
    
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
 */
export const fetchStoreTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[]
): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions for stores [${storeIds.join(', ')}] from ${fromDate} to ${toDate}`);
    
    let query = supabase
      .from('transactions')
      .select('id, store_id, amount, transaction_date, customer_id, external_id, created_at, product_id');
    
    // Apply date range filters
    query = query.gte('transaction_date', fromDate)
                .lte('transaction_date', toDate);
    
    // Apply store_id filter if needed
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query.order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transaction data for stores:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions for selected stores`);
    return data || [];
  } catch (error) {
    console.error('Exception in fetchStoreTransactionData:', error);
    throw error;
  }
};
