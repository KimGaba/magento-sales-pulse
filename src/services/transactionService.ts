
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';

/**
 * Fetches all transaction data for the given date range
 * Simplified version that doesn't apply store filtering
 */
export const fetchTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate}`);
    
    // Build a simple query without column selection or joins
    let query = supabase.from('transactions').select('*');
    
    // Apply date filters
    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }
    
    // We're ignoring the storeIds filter for now
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    return mapTransactionsData(data || []);
  } catch (error) {
    console.error('Error in fetchTransactionData:', error);
    toast({
      title: "Error fetching transactions",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Simple function to count the number of transactions in the database
 * No filters, just a basic count
 */
export const getTransactionCount = async (): Promise<number> => {
  try {
    console.log('Fetching transaction count');
    
    // Simple count query without any joins or filters
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting transactions:', error);
      toast({
        title: "Error counting transactions",
        description: error.message,
        variant: "destructive"
      });
      return 0;
    }
    
    console.log(`Found ${count} transactions in the database`);
    return count || 0;
  } catch (error) {
    console.error('Error in getTransactionCount:', error);
    toast({
      title: "Error counting transactions",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return 0;
  }
};

/**
 * Maps the raw data from Supabase to the Transaction type
 */
const mapTransactionsData = (data: any[]): Transaction[] => {
  const transactions: Transaction[] = data.map(item => ({
    customer_id: item.customer_id,
    amount: item.amount,
    transaction_date: item.transaction_date,
    id: item.id,
    external_id: item.external_id,
    created_at: item.created_at,
    product_id: item.product_id,
    store_id: item.store_id
  }));
  
  // Sort the data in memory
  transactions.sort((a, b) => {
    return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
  });
  
  console.log(`Fetched ${transactions.length} transactions`);
  return transactions;
};
