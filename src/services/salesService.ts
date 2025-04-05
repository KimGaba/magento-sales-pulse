import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';
import { fetchTransactionData, getTransactionCount, testDatabaseConnection } from './transactionService';
import { format, parseISO } from 'date-fns';

/**
 * Tests if the database connection is working
 */
export const testDatabase = async () => {
  return await testDatabaseConnection();
};

/**
 * Fetches daily sales data from transactions
 */
export const fetchDailySalesData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    console.log(`Fetching daily sales from ${fromDate} to ${toDate}, storeIds:`, storeIds);
    
    // Directly use the Supabase client for fetching transactions to bypass any service abstraction issues
    let query = supabase
      .from('transactions')
      .select('id, store_id, amount, transaction_date, customer_id, external_id, created_at, product_id')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    // Apply store_id filter if needed
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering by store IDs:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
    const { data: transactions, error } = await query.order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transaction data for daily sales:', error);
      throw error;
    }
    
    console.log(`Fetched ${transactions?.length || 0} transactions for daily sales calculation`);
    
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Group transactions by date to create daily sales data
    const salesByDate = transactions.reduce((acc, transaction) => {
      // Extract just the date part (YYYY-MM-DD)
      const date = format(parseISO(transaction.transaction_date), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          date: date,
          total_sales: 0,
          order_count: 0
        };
      }
      
      acc[date].total_sales += transaction.amount;
      acc[date].order_count += 1;
      
      return acc;
    }, {} as Record<string, {
      date: string;
      total_sales: number;
      order_count: number;
    }>);
    
    const dailySalesData = Object.values(salesByDate);
    console.log(`Calculated ${dailySalesData.length} daily sales records from transactions`);
    
    return dailySalesData;
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    toast({
      title: "Error fetching daily sales data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Fetches total transaction count from the database
 * A simple function to check if we can access any data
 */
export const fetchTransactionCount = async () => {
  try {
    // Direct Supabase query to bypass potential abstraction issues
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error getting transaction count:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Exception in fetchTransactionCount:', error);
    return 0; // Return 0 instead of throwing to avoid breaking the UI
  }
};

/**
 * Fetches months that have sales data available
 * Returns an array of dates (first day of each month that has data)
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching available data months, storeIds:', storeIds);
    
    // We'll just get the past 24 months to keep the query small
    const fromDate = format(new Date(new Date().setMonth(new Date().getMonth() - 24)), 'yyyy-MM-dd');
    const toDate = format(new Date(), 'yyyy-MM-dd');
    
    // Direct Supabase query
    let query = supabase
      .from('transactions')
      .select('transaction_date')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
      
    // Apply store_id filter if needed
    if (storeIds && storeIds.length > 0) {
      console.log('Filtering months by store IDs:', storeIds);
      query = query.in('store_id', storeIds);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction dates:', error);
      throw error;
    }
    
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Process the dates to get unique months (first day of each month)
    const uniqueMonths = new Set<string>();
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthKey);
    });
    
    // Convert to array of Date objects (first day of each month)
    const monthsWithData = Array.from(uniqueMonths).map(monthKey => {
      const [year, month] = monthKey.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }).sort((a, b) => a.getTime() - b.getTime());
    
    console.log(`Found ${monthsWithData.length} months with data:`, 
      monthsWithData.map(d => format(d, 'MMM yyyy')).join(', '));
    return monthsWithData;
  } catch (error) {
    console.error('Error fetching available data months:', error);
    toast({
      title: "Error fetching available months",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};
