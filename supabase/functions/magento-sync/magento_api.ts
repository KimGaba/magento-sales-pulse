import { supabase } from "../_shared/db_client.ts";
import { MagentoConnection } from "../_shared/database_types.ts";

// Update the fetchAllMagentoProducts function to use per-store and per-type sync date
export async function fetchAndStoreProductData(
  connection: MagentoConnection,
  storeId: string,
  supabaseClient: any
): Promise<any[]> {
  try {
    console.log(`Fetching products for store ${storeId}`);
    
    // Get the last sync date for products specifically
    const { data: lastSyncData, error: syncError } = await supabaseClient.rpc(
      'get_last_sync_date',
      { 
        store_id_param: storeId,
        data_type_param: 'products'
      }
    );
    
    const lastSyncDate = lastSyncData || null;
    console.log(`Last sync date for products: ${lastSyncDate}`);
    
    // Set up pagination
    const pageSize = 100;
    let currentPage = 1;
    let allProducts: any[] = [];
    let hasMoreProducts = true;
    
    while (hasMoreProducts) {
      console.log(`Fetching products page ${currentPage} with pageSize ${pageSize}`);
      
      // Build the API URL with filtering and pagination
      let apiUrl = `${connection.store_url}/rest/V1/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`;
      
      // Add updated_at filter if we have a last sync date
      if (lastSyncDate) {
        // Format date to ISO string and encode
        const formattedDate = new Date(lastSyncDate).toISOString();
        apiUrl += `&searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(formattedDate)}&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
      }
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const pageProducts = data.items || [];
      
      // Add to our collection
      allProducts = [...allProducts, ...pageProducts];
      
      // Check if we should continue pagination
      hasMoreProducts = pageProducts.length === pageSize;
      
      // Break if we're at the end or hit max pages
      if (!hasMoreProducts) {
        console.log(`No more products to fetch or reached page limit. Total fetched: ${allProducts.length}`);
        break;
      }
      
      // Move to next page
      currentPage++;
    }
    
    // Process and store products
    const processedProducts = await storeProductsInDatabase(allProducts, storeId, supabaseClient);
    
    // Update the last sync date for products
    await supabaseClient.rpc('update_last_sync_date', {
      store_id_param: storeId,
      data_type_param: 'products',
      sync_date: new Date().toISOString()
    });
    
    console.log(`Processed ${processedProducts.length} products`);
    return processedProducts;
  } catch (error) {
    console.error(`Error in fetchAndStoreProductData: ${error.message}`);
    throw error;
  }
}

// Update the fetchAllMagentoOrders function to use per-store and per-type sync date
export async function fetchAllMagentoOrders(
  connection: MagentoConnection,
  maxPages: number = 1000,
  pageSize: number = 100,
  maxOrders?: number
): Promise<{ orders: any[], totalCount: number }> {
  try {
    let allOrders: any[] = [];
    let currentPage = 1;
    let totalCount = 0;
    let ordersProcessed = 0;
    
    // Get the last sync date for orders specifically
    const { data: lastSyncData, error: syncError } = await supabase.rpc(
      'get_last_sync_date',
      { 
        store_id_param: connection.store_id!,
        data_type_param: 'orders'
      }
    );
    
    const lastSyncDate = lastSyncData || null;
    console.log(`Last sync date for orders: ${lastSyncDate}`);
    
    while (currentPage <= maxPages) {
      console.log(`Fetching orders page ${currentPage} with pageSize ${pageSize}`);
      
      let apiUrl = `${connection.store_url}/rest/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`;
      
      // Add updated_at filter if we have a last sync date
      if (lastSyncDate) {
        const formattedDate = new Date(lastSyncDate).toISOString();
        apiUrl += `&searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(formattedDate)}&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
      }
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Magento API error (${response.status}): ${errorText}`);
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.items) {
          const orders = data.items;
          allOrders = [...allOrders, ...orders];
          totalCount = data.total_count;
          ordersProcessed += orders.length;
          
          console.log(`Fetched ${orders.length} orders, total processed: ${ordersProcessed}`);
          
          if (orders.length < pageSize || (maxOrders && ordersProcessed >= maxOrders)) {
            console.log('No more orders to fetch or max orders reached. Breaking pagination.');
            break;
          }
        } else {
          console.warn('No orders found on this page, stopping pagination.');
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}: ${error.message}`);
        throw error;
      }
      
      currentPage++;
    }
    
    // After successfully fetching all orders, update the last sync date
    await supabase.rpc('update_last_sync_date', {
      store_id_param: connection.store_id!,
      data_type_param: 'orders',
      sync_date: new Date().toISOString()
    });
    
    console.log(`Successfully fetched ${allOrders.length} orders.`);
    return { orders: allOrders, totalCount: allOrders.length };
  } catch (error) {
    console.error(`Error in fetchAllMagentoOrders: ${error.message}`);
    throw error;
  }
}

// Helper function to store products in database
async function storeProductsInDatabase(products: any[], storeId: string, supabaseClient: any): Promise<any[]> {
  try {
    const productsToUpsert = products.map(product => ({
      store_id: storeId,
      external_id: product.id.toString(),
      sku: product.sku,
      name: product.name,
      description: product.custom_attributes?.find((attr: any) => attr.attribute_code === 'description')?.value || '',
      price: product.price,
      in_stock: product.extension_attributes?.stock_item?.is_in_stock || false,
      image_url: product.media_gallery_entries?.[0]?.file || null,
      updated_at: new Date().toISOString()
    }));
    
    // Batch upsert products
    const { data, error } = await supabaseClient
      .from('products')
      .upsert(productsToUpsert, {
        onConflict: 'store_id,external_id',
        returning: 'minimal'
      });
    
    if (error) {
      console.error(`Error storing products: ${error.message}`);
      throw error;
    }
    
    return productsToUpsert;
  } catch (error) {
    console.error(`Error in storeProductsInDatabase: ${error.message}`);
    throw error;
  }
}
