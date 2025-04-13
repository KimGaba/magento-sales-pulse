
import { supabase } from '@/integrations/supabase/client';
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
    
    if (!data || data.length === 0) {
      console.log('No daily sales data found for the specified date range');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchDailySalesData:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching daily sales data');
  }
};

/**
 * Fetches available data months for filtering
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []): Promise<{month: string, year: number}[]> => {
  try {
    console.log('Fetching available data months');
    console.log('Store IDs filter:', storeIds);
    
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
    
    return result;
  } catch (error) {
    console.error('Error in fetchAvailableDataMonths:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while fetching available data months');
  }
};
