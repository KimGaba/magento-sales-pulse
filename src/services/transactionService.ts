
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';

/**
 * Basic test to check database connectivity
 * Simply logs the raw response to help diagnose issues
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing basic database connectivity...');
    
    // Most basic query possible - specify the table explicitly to avoid ambiguity
    const { data, error, status, statusText } = await supabase
      .from('transactions')
      .select('transactions.*')
      .limit(1);
    
    // Log everything to help diagnose the issue
    console.log('Supabase response status:', status, statusText);
    console.log('Data:', data);
    
    if (error) {
      console.error('Database connection error:', error);
      toast({
        title: "Database connection error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Exception in testDatabaseConnection:', error);
    toast({
      title: "Error checking database",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Extremely simple function to check database connectivity
 * No filters, no joins, just a basic count
 */
export const getTransactionCount = async (): Promise<number> => {
  try {
    console.log('Simple database check: counting transactions');
    
    // Most basic count query possible - specify the table explicitly
    const { count, error } = await supabase
      .from('transactions')
      .select('transactions.*', { count: 'exact' });
    
    if (error) {
      console.error('Database error:', error);
      toast({
        title: "Database error",
        description: error.message,
        variant: "destructive"
      });
      return 0;
    }
    
    console.log(`Found ${count} transactions`);
    return count || 0;
  } catch (error) {
    console.error('Exception in getTransactionCount:', error);
    toast({
      title: "Error checking database",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return 0;
  }
};

/**
 * Simplified transaction fetching with only essential filtering
 * No joins, only simple field selection
 */
export const fetchTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
): Promise<Transaction[]> => {
  try {
    console.log(`Simple fetch: transactions from ${fromDate} to ${toDate}`);
    
    // Start with absolutely minimal query - explicitly specify table to avoid ambiguity
    let query = supabase.from('transactions').select('transactions.*');
    
    // Apply date filters
    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }
    
    // Apply store filter if provided, using fully qualified column name
    if (storeIds && storeIds.length > 0) {
      query = query.in('transactions.store_id', storeIds);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error in fetchTransactionData:', error);
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} transactions`);
    return data as Transaction[] || [];
  } catch (error) {
    console.error('Exception in fetchTransactionData:', error);
    toast({
      title: "Error fetching transactions",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Maps the raw data from Supabase to the Transaction type
 * Simplified to just return the data as is, with minimal processing
 */
const mapTransactionsData = (data: any[]): Transaction[] => {
  return data;
};
