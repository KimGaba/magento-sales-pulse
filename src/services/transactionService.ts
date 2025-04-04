
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all transaction data for the given date range
 */
export const fetchTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    console.log(`Fetching transactions from ${fromDate} to ${toDate} for stores:`, storeIds);
    
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('transactions.transaction_date', fromDate)
      .lte('transactions.transaction_date', toDate)
      .order('transactions.transaction_date', { ascending: false });
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('transactions.store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
};
