
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
    
    // Create a query with proper column selection to avoid ambiguity
    let query = supabase
      .from('transactions')
      .select(`
        id,
        transaction_date,
        amount,
        customer_id,
        external_id,
        created_at,
        product_id,
        store_id
      `)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
    // Apply ordering
    query = query.order('transaction_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      
      // Show toast with error
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
      
      // Return empty array instead of throwing an error, ensuring type safety
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchTransactionData:', error);
    // Return empty array instead of throwing an error when catching exceptions
    return [];
  }
};
