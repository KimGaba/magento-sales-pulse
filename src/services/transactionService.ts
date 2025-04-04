
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
    
    // Log the raw query we're about to build
    console.log('Building query with table: transactions');
    
    // First, let's see what tables are being joined in this query
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_query_tables', { table_name: 'transactions' })
      .single();
    
    if (tableError) {
      console.log('Error fetching table information:', tableError);
    } else {
      console.log('Table information:', tableInfo);
    }
    
    // Let's try using explicit table aliases in our query
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    if (storeIds && storeIds.length > 0) {
      // Log exactly what we're filtering on
      console.log('Filtering on store_ids:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
    // Apply ordering without table prefix
    query = query.order('transaction_date', { ascending: false });
    
    // Debug the generated SQL (approximate)
    console.log('Approximate SQL query:', query.toSQL ? query.toSQL() : 'SQL preview not available');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      
      // Let's try a simplified query to see if that works
      console.log('Attempting simplified query without filtering or ordering...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('transactions')
        .select('id, transaction_date, amount, customer_id')
        .limit(5);
        
      if (simpleError) {
        console.error('Even simplified query failed:', simpleError);
      } else {
        console.log('Simplified query succeeded with sample data:', simpleData);
      }
      
      // Show toast with error
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
