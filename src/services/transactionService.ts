
// Only updating the fetchBasketOpenerProducts function to include order status filtering

/**
 * Fetches basket opener products within a date range with additional filtering
 */
export const fetchBasketOpenerProducts = async (
  fromDate: string,
  toDate: string,
  storeIds: string[] = [],
  storeView?: string,
  customerGroup?: string,
  orderStatuses?: string[]
): Promise<BasketOpenerProduct[]> => {
  try {
    console.log(`Fetching basket opener products from ${fromDate} to ${toDate}`);
    console.log(`Store IDs filter:`, storeIds);
    console.log(`Store view filter: ${storeView || 'all'}`);
    console.log(`Customer group filter: ${customerGroup || 'all'}`);
    console.log(`Order status filter:`, orderStatuses || 'all');
    
    // Using the rpc function we created in the database
    // Fix: Create a properly typed params object that matches the expected type
    const params: { 
      start_date: string; 
      end_date: string; 
      store_filter?: string[];
      customer_group?: string;
      store_view?: string;
      order_statuses?: string[];
    } = { 
      start_date: fromDate, 
      end_date: toDate,
      store_filter: storeIds.length > 0 ? storeIds : undefined
    };
    
    // Add customer_group parameter if specified
    if (customerGroup && customerGroup !== 'alle') {
      params.customer_group = customerGroup;
    }
    
    // Add store_view parameter if specified
    if (storeView && storeView !== 'alle') {
      params.store_view = storeView;
    }
    
    // Add order_statuses parameter if specified
    if (orderStatuses && orderStatuses.length > 0) {
      params.order_statuses = orderStatuses;
    }
    
    console.log('RPC params:', params);
    
    const { data, error } = await supabase
      .rpc('get_basket_opener_products', params);
    
    if (error) {
      console.error('Error fetching basket opener products:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} basket opener products`);
    
    // Add more detailed logging for debugging
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('First few basket opener products:', data.slice(0, 3));
    } else {
      console.log('No basket opener products found matching the criteria');
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Exception in fetchBasketOpenerProducts:', error);
    throw error;
  }
};
