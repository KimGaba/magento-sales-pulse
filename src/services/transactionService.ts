
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';

/**
 * Fetches all transaction data for the given date range
 */
export const fetchTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate} for stores:`, storeIds);
    
    // Build the query starting with select() to get the correct types for filter methods
    let query = supabase
      .from('transactions')
      .select(`
        id,
        external_id,
        customer_id,
        amount,
        transaction_date,
        created_at,
        product_id,
        store_id
      `);
    
    // Apply date filters
    query = query.gte('transaction_date', fromDate)
                 .lte('transaction_date', toDate);
    
    // Apply store filter if needed
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
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
