
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
    
    // Create a query that explicitly selects all columns with table prefixes to avoid ambiguity
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
        transactions.store_id
      `)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('transactions.store_id', storeIds);
    }
    
    // Apply ordering with explicit table name
    query = query.order('transaction_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      
      // Try a minimal query as a fallback
      console.log('Attempting minimal query...');
      const { data: minimalData, error: minimalError } = await supabase
        .from('transactions')
        .select('id, transaction_date, amount')
        .limit(5);
        
      if (minimalError) {
        console.error('Even minimal query failed:', minimalError);
      } else {
        console.log('Minimal query succeeded with sample data:', minimalData);
      }
      
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
      
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchTransactionData:', error);
    throw error;
  }
};
