
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';

/**
 * Extremely simple function to check database connectivity
 * No filters, no joins, just a basic count
 */
export const getTransactionCount = async (): Promise<number> => {
  try {
    console.log('Simple database check: counting transactions');
    
    // Most basic count query possible
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' });
    
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
    
    // Start with absolutely minimal query
    let query = supabase.from('transactions').select('*');
    
    // Apply date filters
    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }
    
    // Apply store filter if provided, using exact column name
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
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
