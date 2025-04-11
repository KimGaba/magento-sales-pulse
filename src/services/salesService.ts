
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

    // Use a direct query on the transactions table to aggregate data on the fly
    // This allows for filtering by metadata like store_view and customer_group
    let query = supabase.rpc('get_daily_sales', {
      start_date: fromDate,
      end_date: toDate,
      store_filter: storeIds.length > 0 ? storeIds : null,
      store_view: storeView && storeView !== 'alle' ? storeView : null,
      customer_group: customerGroup && customerGroup !== 'alle' ? customerGroup : null,
      order_statuses: orderStatuses && orderStatuses.length > 0 ? orderStatuses : null
    });
    
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
    let query = supabase.rpc('get_available_months');
    
    if (storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching available months:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchAvailableDataMonths:', error);
    throw error;
  }
};
