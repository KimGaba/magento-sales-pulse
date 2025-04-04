
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetches daily sales data
 */
export const fetchDailySalesData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    console.log(`Fetching daily sales from ${fromDate} to ${toDate} for stores:`, storeIds);
    
    let query = supabase
      .from('daily_sales')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching daily sales data:', error);
      toast({
        title: "Error fetching daily sales data",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} daily sales records`);
    return data || [];
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
 * Fetches months that have sales data available
 * Returns an array of dates (first day of each month that has data)
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching available data months for stores:', storeIds);
    
    // This query extracts the first day of each month that has data
    let query = supabase
      .from('daily_sales')
      .select('date')
      .order('date');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching available data months:', error);
      toast({
        title: "Error fetching available months",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    // Process the dates to get unique months (first day of each month)
    const uniqueMonths = new Set<string>();
    data?.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      uniqueMonths.add(monthKey);
    });
    
    // Convert to array of Date objects (first day of each month)
    const monthsWithData = Array.from(uniqueMonths).map(monthKey => {
      const [year, month] = monthKey.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }).sort((a, b) => a.getTime() - b.getTime());
    
    console.log(`Found ${monthsWithData.length} months with data`);
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
