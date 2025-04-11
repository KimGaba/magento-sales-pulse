
import { supabase } from '@/integrations/supabase/client';
import { DailySales } from '@/types/sales';

/**
 * Fetches daily sales data for the specified date range and stores
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
    console.log('Store IDs:', storeIds);
    console.log('Store view:', storeView);
    console.log('Customer group:', customerGroup);
    console.log('Order statuses:', orderStatuses);

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
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchDailySalesData:', error);
    throw error;
  }
};

/**
 * Fetches available data months 
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []): Promise<{month: string, year: number}[]> => {
  try {
    // Use a direct SQL query to get distinct months from sales data
    const { data, error } = await supabase
      .from('daily_sales')
      .select('date')
      .order('date');
    
    if (error) {
      console.error('Error fetching available months:', error);
      throw error;
    }
    
    // Process the dates to get unique month/year combinations
    const monthsSet = new Set<string>();
    const result: {month: string, year: number}[] = [];
    
    if (data && data.length > 0) {
      data.forEach(item => {
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
    throw error;
  }
};
