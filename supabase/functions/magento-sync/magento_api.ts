
import { MagentoConnection } from "../_shared/database_types.ts";
import { supabase } from "../_shared/db_client.ts";

// Define types for Magento API responses
interface MagentoOrderItem {
  item_id: string;
  sku: string;
  name: string;
  price: string;
  qty_ordered: number;
  product_type: string;
  product_id: string;
}

interface MagentoOrder {
  entity_id: string;
  increment_id: string;
  created_at: string;
  grand_total: string;
  customer_email?: string;
  customer_firstname?: string;
  customer_lastname?: string;
  store_id?: string;
  customer_group_id?: string | number;
  status: string;
  items?: MagentoOrderItem[];
  payment?: {
    method?: string;
  };
  shipping_description?: string;
}

interface MagentoOrdersResponse {
  items: MagentoOrder[];
  total_count: number;
  search_criteria: {
    page_size: number;
    current_page: number;
  };
}

interface MagentoStoreView {
  id: string;
  name: string;
  code: string;
  website_id: string;
}

interface MagentoWebsite {
  id: string;
  name: string;
  code: string;
}

// Function to determine date range based on subscription level
function getDateRangeForSubscription(connectionId: string, subscriptionLevel = 'free'): { from: string, to: string } {
  const now = new Date();
  
  let monthsBack = 3; // Default for 'free' plan
  
  // Adjust months back based on subscription level
  if (subscriptionLevel.toLowerCase() === 'premium') {
    monthsBack = 12;
  } else if (subscriptionLevel.toLowerCase() === 'business') {
    monthsBack = 36; // 3 years
  } else if (subscriptionLevel.toLowerCase() === 'enterprise') {
    monthsBack = 60; // 5 years
  }
  
  // Calculate the from date
  const fromDate = new Date(now);
  fromDate.setMonth(now.getMonth() - monthsBack);
  
  return {
    from: fromDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    to: now.toISOString().split('T')[0] // Today
  };
}

// Function to get user's subscription level
async function getUserSubscriptionLevel(connectionId: string): Promise<string> {
  try {
    // Get the user_id from the connection
    const { data: connection, error: connectionError } = await supabase
      .from('magento_connections')
      .select('user_id')
      .eq('id', connectionId)
      .maybeSingle();
      
    if (connectionError || !connection) {
      console.error('Error fetching connection:', connectionError?.message || 'No connection found');
      return 'free'; // Default to free if there's an error
    }
    
    // Here you would typically fetch the user's subscription from a profiles or subscriptions table
    // For now we'll return 'free' as default
    return 'free';
  } catch (error) {
    console.error('Error fetching subscription level:', error.message);
    return 'free';
  }
}

// Function to check if a date is within the subscription window
export function isDateWithinSubscriptionWindow(dateStr: string, fromDate: string, toDate: string): boolean {
  try {
    const date = new Date(dateStr);
    const from = new Date(fromDate + ' 00:00:00');
    const to = new Date(toDate + ' 23:59:59');
    
    return date >= from && date <= to;
  } catch (e) {
    console.error('Error parsing date for subscription window check:', e);
    return false;
  }
}

// Helper function to get customer name from order
function getCustomerName(order: MagentoOrder): string {
  if (order.customer_firstname) {
    return `${order.customer_firstname} ${order.customer_lastname || ''}`.trim();
  }
  return 'Guest Customer';
}

// Helper function to get store view name/code from store_id
async function getStoreViewInfo(storeId: string, connectionId: string): Promise<{ name: string, code: string }> {
  try {
    // Look up the store view in our database
    const { data: storeView, error } = await supabase
      .from('magento_store_views')
      .select('store_view_name, store_view_code')
      .eq('connection_id', connectionId)
      .eq('store_id', storeId)
      .maybeSingle();
      
    if (error || !storeView) {
      console.warn(`⚠️ Store view with ID ${storeId} not found for connection ${connectionId}`);
      return { name: `Store ${storeId}`, code: storeId.toString() };
    }
    
    return { 
      name: storeView.store_view_name, 
      code: storeView.store_view_code 
    };
  } catch (error) {
    console.error(`Error fetching store view info: ${error.message}`);
    return { name: `Store ${storeId}`, code: storeId.toString() };
  }
}

// New function to fetch ALL Magento orders with pagination
export async function fetchAllMagentoOrders(
  connection: MagentoConnection, 
  maxPages = 10, 
  pageSize = 100, 
  subscriptionLevel?: string
) {
  try {
    console.log(`📦 Starting to fetch all Magento orders from ${connection.store_url}, max pages: ${maxPages}`);
    
    // Get subscription level if not provided
    if (!subscriptionLevel) {
      subscriptionLevel = await getUserSubscriptionLevel(connection.id);
    }
    
    // Get date range based on subscription
    const dateRange = getDateRangeForSubscription(connection.id, subscriptionLevel);
    console.log(`Using date range for ${subscriptionLevel} subscription: ${dateRange.from} to ${dateRange.to}`);
    
    // Array to store all orders
    const allOrders: MagentoOrder[] = [];
    
    // Stats for tracking
    let totalOrderCount = 0;
    let filteredOutCount = 0;
    let emptyPageCount = 0;
    let lastNonEmptyPage = 0;
    
    // Loop through pages until we hit maxPages or run out of orders
    for (let page = 1; page <= maxPages; page++) {
      console.log(`📊 Fetching page ${page} of orders...`);
      
      const result = await fetchMagentoOrdersPage(
        connection, 
        page, 
        pageSize, 
        dateRange.from, 
        dateRange.to
      );
      
      if (!result.success) {
        console.error(`❌ Failed to fetch page ${page}: ${result.error}`);
        break;
      }
      
      totalOrderCount = result.totalCount;
      
      // If we got orders, process them
      if (result.orders.length > 0) {
        allOrders.push(...result.orders);
        lastNonEmptyPage = page;
        console.log(`📊 Retrieved ${result.orders.length} orders from page ${page}`);
      } else {
        emptyPageCount++;
        console.log(`📊 Page ${page} returned 0 orders`);
        
        // If we got 2 empty pages in a row and we already have orders, assume we're done
        if (emptyPageCount >= 2 && allOrders.length > 0) {
          console.log(`📊 Received ${emptyPageCount} empty pages in a row, stopping pagination`);
          break;
        }
      }
      
      // If we've reached the reported total count, we can stop
      if (allOrders.length >= totalOrderCount) {
        console.log(`📊 Retrieved all ${totalOrderCount} orders, stopping pagination`);
        break;
      }
      
      // Add a small delay to avoid rate limiting
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`📊 Completed fetching orders. Retrieved ${allOrders.length} total orders across ${lastNonEmptyPage} pages.`);
    
    // Now we need to transform these orders for our system
    const transformedOrders = await Promise.all(
      allOrders.map(async (order) => {
        // Process store view info
        let storeViewInfo = { name: 'default', code: 'default' };
        
        if (order.store_id) {
          storeViewInfo = await getStoreViewInfo(order.store_id, connection.id);
        }
        
        return {
          external_id: order.increment_id,
          transaction_date: order.created_at,
          amount: parseFloat(order.grand_total),
          customer_id: order.customer_email,
          customer_name: getCustomerName(order),
          store_view: storeViewInfo.code || storeViewInfo.name || 'default',
          customer_group: order.customer_group_id?.toString() || 'none',
          status: order.status,
          items: order.items?.length || 0,
          // Include full order items array
          items_data: order.items || [],
          order_data: {
            payment_method: order.payment?.method || 'unknown',
            shipping_method: order.shipping_description || 'unknown'
          }
        };
      })
    );
    
    return {
      orders: transformedOrders,
      totalCount,
      filteredOutCount,
      subscriptionWindow: dateRange,
      pagesFetched: lastNonEmptyPage
    };
  } catch (error) {
    console.error(`❌ Error fetching all Magento orders: ${error.message}`);
    throw error;
  }
}

// Helper function to fetch a single page of orders
async function fetchMagentoOrdersPage(
  connection: MagentoConnection, 
  page = 1, 
  pageSize = 100,
  fromDate: string,
  toDate: string
) {
  try {
    // Construct URL with date filters
    let url = `${connection.store_url}/rest/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}`;
    
    // Add date filter conditions
    url += `&searchCriteria[filter_groups][0][filters][0][field]=created_at`;
    url += `&searchCriteria[filter_groups][0][filters][0][condition_type]=gteq`;
    url += `&searchCriteria[filter_groups][0][filters][0][value]=${fromDate} 00:00:00`;
    
    url += `&searchCriteria[filter_groups][1][filters][0][field]=created_at`;
    url += `&searchCriteria[filter_groups][1][filters][0][condition_type]=lteq`;
    url += `&searchCriteria[filter_groups][1][filters][0][value]=${toDate} 23:59:59`;
    
    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };

    console.log(`Making request to: ${url}`);
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      return { 
        success: false, 
        error: `Failed to fetch orders: ${response.statusText}`,
        orders: [],
        totalCount: 0 
      };
    }

    const data = await response.json() as MagentoOrdersResponse;
    const orders = data.items || [];
    
    // Only return orders that are within the subscription window
    // This step is redundant since we filter by date in the API call,
    // but it's a safety check
    return {
      success: true,
      orders,
      totalCount: data.total_count || orders.length
    };
  } catch (error) {
    console.error(`❌ Error fetching Magento orders page ${page}: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      orders: [],
      totalCount: 0 
    };
  }
}

// Legacy function for backward compatibility - uses the new implementation
export async function fetchMagentoOrdersData(connection: MagentoConnection, page = 1, pageSize = 100, subscriptionLevel?: string) {
  try {
    console.log(`📦 Using legacy fetchMagentoOrdersData function, page ${page}`);
    
    // We'll only fetch the first page with this legacy function
    const result = await fetchAllMagentoOrders(connection, 1, pageSize, subscriptionLevel);
    
    return {
      orders: result.orders,
      totalCount: result.totalCount,
      filteredOutCount: result.filteredOutCount,
      subscriptionWindow: result.subscriptionWindow
    };
  } catch (error) {
    console.error(`❌ Error in legacy fetchMagentoOrdersData: ${error.message}`);
    throw error;
  }
}

// Function to fetch store views from Magento
export async function fetchMagentoStoreViews(connection: MagentoConnection) {
  try {
    console.log(`📦 Fetching Magento store views from ${connection.store_url}`);
    const url = `${connection.store_url}/rest/V1/store/storeViews`;

    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch store views: ${response.statusText}`);
    }

    const storeViews = await response.json() as MagentoStoreView[];
    
    // Also fetch websites for more context
    const websitesUrl = `${connection.store_url}/rest/V1/store/websites`;
    const websitesResponse = await fetch(websitesUrl, { method: 'GET', headers });
    
    if (!websitesResponse.ok) {
      console.warn(`Couldn't fetch websites: ${websitesResponse.statusText}`);
      return storeViews;
    }
    
    const websites = await websitesResponse.json() as MagentoWebsite[];
    
    // Create a mapping of website IDs to names
    const websiteMap: Record<string, string> = {};
    websites.forEach((website) => {
      websiteMap[website.id] = website.name;
    });
    
    // Store the store views in the database
    for (const view of storeViews) {
      try {
        // Check if the store view already exists
        const { data: existingView, error: checkError } = await supabase
          .from('magento_store_views')
          .select('*')
          .eq('store_id', view.id)
          .eq('connection_id', connection.id)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking for existing store view: ${checkError.message}`);
          continue;
        }
        
        const storeViewData = {
          connection_id: connection.id,
          store_id: view.id,
          store_name: view.name,
          store_view_code: view.code,
          store_view_name: view.name,
          website_id: view.website_id,
          website_name: websiteMap[view.website_id] || `Website ${view.website_id}`,
          is_active: true,
          updated_at: new Date().toISOString()
        };
        
        if (existingView) {
          // Update existing store view
          const { error: updateError } = await supabase
            .from('magento_store_views')
            .update(storeViewData)
            .eq('id', existingView.id);
            
          if (updateError) {
            console.error(`Error updating store view: ${updateError.message}`);
          } else {
            console.log(`Updated store view: ${view.name}`);
          }
        } else {
          // Insert new store view
          const { error: insertError } = await supabase
            .from('magento_store_views')
            .insert(storeViewData);
            
          if (insertError) {
            console.error(`Error inserting store view: ${insertError.message}`);
          } else {
            console.log(`Inserted store view: ${view.name}`);
          }
        }
      } catch (viewError) {
        console.error(`Error processing store view ${view.name}: ${viewError.message}`);
      }
    }
    
    return storeViews;
  } catch (error) {
    console.error(`❌ Error fetching or storing Magento store views: ${error.message}`);
    throw error;
  }
}

// Function to fetch and store product data
export async function fetchAndStoreProductData(connection: MagentoConnection, storeId: string, supabase: any) {
  try {
    console.log(`📦 Fetching Magento products from ${connection.store_url}`);
    const url = `${connection.store_url}/rest/V1/products?searchCriteria[pageSize]=100`;

    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    const products = data.items || [];

    for (const product of products) {
      try {
        const productData = {
          external_id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price || null,
          special_price: product.special_price || null,
          description: product.description || null,
          image_url: product.media_gallery_entries && product.media_gallery_entries.length > 0 
            ? `${connection.store_url}/media/catalog/product${product.media_gallery_entries[0].file}` 
            : null,
          in_stock: product.extension_attributes?.stock_item?.is_in_stock || false,
          status: product.status === 1 ? 'enabled' : 'disabled',
          type: product.type_id || 'simple',
          store_view: 'default'
        };

        const { data: existing, error: fetchErr } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('external_id', product.id.toString())
          .maybeSingle();

        if (fetchErr) {
          console.error(`Error fetching product: ${fetchErr.message}`);
          continue;
        }

        if (existing) {
          await supabase.from('products').update({
            ...productData,
            updated_at: new Date().toISOString()
          }).eq('id', existing.id);
        } else {
          await supabase.from('products').insert({
            ...productData,
            store_id: storeId
          });
        }
      } catch (productError) {
        console.error(`Error processing product ${product.sku}: ${productError.message}`);
      }
    }

    return products;
  } catch (error) {
    console.error(`❌ Error fetching or storing Magento products: ${error.message}`);
    throw error;
  }
}
