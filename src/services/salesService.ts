
import { supabase } from '@/integrations/railway/client';
import { DailySales } from '@/types/sales';

/**
 * Fetches daily sales data for the specified date range and filters
 */
export const fetchDailySalesData = async (
  fromDate: string, 
  toDate: string, 
  storeIds: string[] = [],
  storeView?: string,
  customerGroup?: string,
  orderStatuses?: string[]
): Promise<DailySales[]> => {
  try {
    console.log(`Fetching daily sales data from ${fromDate} to ${toDate}`);
    
    if (!fromDate || !toDate) {
      throw new Error('From date and to date are required');
    }

    console.log('Filter parameters:');
    console.log('- Store IDs:', storeIds);
    console.log('- Store view:', storeView);
    console.log('- Customer group:', customerGroup);
    console.log('- Order statuses:', orderStatuses);

    // Check if the daily_sales table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'daily_sales' }
    );
    
    if (tableCheckError) {
      console.error('Error checking if daily_sales table exists:', tableCheckError);
      // Continue with the fallback approach
      return await fetchDailySalesFromTransactions(fromDate, toDate, storeIds);
    }
    
    if (!tableExists) {
      console.log('daily_sales table does not exist, using fallback to transactions table');
      return await fetchDailySalesFromTransactions(fromDate, toDate, storeIds);
    }

    // Use the select query to get data from the daily_sales table
    let query = supabase.from('daily_sales')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    // Apply store filter if provided
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching daily sales data:', error);
      throw new Error(`Failed to fetch daily sales: ${error.message}`);
    }
    
    // If no data found in daily_sales table, use fallback to transactions
    if (!data || data.length === 0) {
      console.log('No data found in daily_sales, using fallback to transactions table');
      return await fetchDailySalesFromTransactions(fromDate, toDate, storeIds);
    }
    
    // Ensure numeric types are consistent
    return data.map(item => ({
      ...item,
      total_sales: Number(item.total_sales),
      order_count: Number(item.order_count),
      average_order_value: item.average_order_value ? Number(item.average_order_value) : null
    }));
  } catch (error) {
    console.error('Error in fetchDailySalesData:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching daily sales data');
  }
};

/**
 * Fallback function to fetch and aggregate sales data directly from transactions
 */
export const fetchDailySalesFromTransactions = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = []
): Promise<DailySales[]> => {
  try {
    console.log('Fetching transactions for fallback daily sales calculation');
    
    // Build the query to fetch transactions
    let query = supabase
      .from('transactions')
      .select('amount, transaction_date, store_id')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate);
    
    // Apply store filter if provided
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions for fallback:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for the specified date range');
      return [];
    }
    
    // Group transactions by date and store_id
    const salesByDateAndStore = transactions.reduce((acc, transaction) => {
      if (!transaction.transaction_date) return acc;
      
      // Extract date part from ISO string
      const transactionDate = transaction.transaction_date.split('T')[0];
      const storeId = transaction.store_id;
      const key = `${transactionDate}-${storeId}`;
      
      if (!acc[key]) {
        acc[key] = {
          date: transactionDate,
          store_id: storeId,
          total_sales: 0,
          order_count: 0,
          sales: new Set() // Use a Set to track unique transaction IDs
        };
      }
      
      // Ensure amount is converted to a number
      const amount = Number(transaction.amount);
      
      // Add the amount to total_sales
      acc[key].total_sales += amount;
      
      // Count as a new order if we haven't seen this transaction before
      acc[key].sales.add(transaction.transaction_date);
      acc[key].order_count = acc[key].sales.size;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert the aggregated data to DailySales format
    const dailySales = Object.values(salesByDateAndStore).map(item => ({
      id: `fallback-${item.date}-${item.store_id}`,
      store_id: item.store_id,
      date: item.date,
      total_sales: Number(item.total_sales.toFixed(2)), // Ensure 2 decimal places
      order_count: item.order_count,
      average_order_value: item.order_count > 0 ? Number((item.total_sales / item.order_count).toFixed(2)) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as DailySales[];
    
    console.log(`Generated ${dailySales.length} fallback daily sales records`);
    return dailySales;
  } catch (error) {
    console.error('Error in fetchDailySalesFromTransactions:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching fallback daily sales data');
  }
};

/**
 * Fetches available data months for filtering
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []): Promise<{month: string, year: number}[]> => {
  try {
    console.log('Fetching available data months');
    console.log('Store IDs filter:', storeIds);
    
    // Check if daily_sales table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'daily_sales' }
    );
    
    if (tableCheckError) {
      console.error('Error checking if daily_sales table exists:', tableCheckError);
      // Continue with fallback
      return await fetchAvailableMonthsFromTransactions(storeIds);
    }
    
    if (!tableExists) {
      console.log('daily_sales table does not exist, using fallback');
      return await fetchAvailableMonthsFromTransactions(storeIds);
    }
    
    // Build the query to get distinct dates from sales data
    let query = supabase
      .from('daily_sales')
      .select('date');
      
    // Apply store filter if provided
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    // Execute query with ordering
    const { data, error } = await query.order('date');
    
    if (error) {
      console.error('Error fetching available months:', error);
      throw new Error(`Failed to fetch available months: ${error.message}`);
    }
    
    // Process the dates to get unique month/year combinations
    const monthsSet = new Set<string>();
    const result: {month: string, year: number}[] = [];
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (!item.date) return; // Skip items without date
        
        const date = new Date(item.date);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        
        if (!monthsSet.has(monthYear)) {
          monthsSet.add(monthYear);
          result.push({
            month: (date.getMonth() + 1).toString(), // 1-12
            year: date.getFullYear()
          });
        }
      });
    }
    
    // If no data in daily_sales, try fallback to transactions
    if (result.length === 0) {
      console.log('No months found in daily_sales, using fallback to transactions table');
      const fallbackMonths = await fetchAvailableMonthsFromTransactions(storeIds);
      return fallbackMonths;
    }
    
    return result;
  } catch (error) {
    console.error('Error in fetchAvailableDataMonths:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching available data months');
  }
};

/**
 * Fallback function to fetch available months directly from transactions
 */
export const fetchAvailableMonthsFromTransactions = async (
  storeIds: string[] = []
): Promise<{month: string, year: number}[]> => {
  try {
    console.log('Fetching transaction dates for fallback months calculation');
    
    // Build the query to get transaction dates
    let query = supabase
      .from('transactions')
      .select('transaction_date');
    
    // Apply store filter if provided
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transaction dates for fallback:', error);
      throw new Error(`Failed to fetch transaction dates: ${error.message}`);
    }
    
    // Process the dates to get unique month/year combinations
    const monthsSet = new Set<string>();
    const result: {month: string, year: number}[] = [];
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (!item.transaction_date) return; // Skip items without date
        
        const date = new Date(item.transaction_date);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        
        if (!monthsSet.has(monthYear)) {
          monthsSet.add(monthYear);
          result.push({
            month: (date.getMonth() + 1).toString(), // 1-12
            year: date.getFullYear()
          });
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in fetchAvailableMonthsFromTransactions:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching fallback available months');
  }
};
