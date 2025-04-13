
import { supabase } from "@/integrations/supabase/client";

// Fetch trends data from Supabase
export const fetchTrendsData = async ({
  storeIds = [],
  fromDate,
  toDate,
  customerGroup,
  orderStatuses = {}
}: {
  storeIds: string[];
  fromDate: string;
  toDate: string;
  customerGroup?: string;
  orderStatuses?: Record<string, boolean>;
}) => {
  try {
    // Build the query based on filters
    let query = supabase
      .from('daily_sales')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    // Apply store IDs filter if provided
    if (storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching trends data:', error);
    throw error;
  }
};

// Fetch category sales data
export const fetchCategorySalesData = async ({
  storeIds = [],
  fromDate,
  toDate
}: {
  storeIds: string[];
  fromDate: string;
  toDate: string;
}) => {
  try {
    // This would be a real API call in a production app
    // Simulating data for now
    return [
      { name: 'Tøj', sales: 12400 },
      { name: 'Sko', sales: 9200 },
      { name: 'Tilbehør', sales: 5600 },
      { name: 'Elektronik', sales: 4300 },
      { name: 'Hjem', sales: 3700 },
    ];
  } catch (error) {
    console.error('Error fetching category sales data:', error);
    throw error;
  }
};
