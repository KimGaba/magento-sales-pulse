
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
