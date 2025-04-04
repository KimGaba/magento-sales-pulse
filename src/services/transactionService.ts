
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
    
    // Build the base query with explicit column selection to avoid ambiguity
    let query = supabase.from('transactions')
      .select('transactions.id, transactions.customer_id, transactions.amount, transactions.transaction_date, transactions.external_id, transactions.created_at, transactions.product_id, transactions.store_id');
    
    // Apply filters after the select() call
    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }
    
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('transactions.store_id', storeIds);
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
