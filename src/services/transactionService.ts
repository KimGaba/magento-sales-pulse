
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
    
    // Select specific columns with explicit table reference
    let query = supabase
      .from('transactions')
      .select(`
        transactions.id,
        transactions.transaction_date,
        transactions.amount,
        transactions.customer_id,
        transactions.external_id,
        transactions.created_at,
        transactions.product_id,
        transactions.store_id
      `)
      .gte('transactions.transaction_date', fromDate)
      .lte('transactions.transaction_date', toDate);
    
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('transactions.store_id', storeIds);
    }
    
    // Apply ordering with explicit table reference
    query = query.order('transactions.transaction_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      
      // Show toast with error
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
      
      return [];
    }
    
    // Ensure we handle the data correctly
    if (!data) {
      return [];
    }
    
    // Map the data to ensure it conforms to the Transaction type
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
    
    console.log(`Fetched ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error('Error in fetchTransactionData:', error);
    return [];
  }
};
