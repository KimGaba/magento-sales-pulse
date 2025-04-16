
import { supabase } from "../utils/supabaseClient";
import { MagentoConnection } from "../types";

/**
 * Fetches product data from Magento API with pagination
 */
export async function fetchProducts(
  connection: MagentoConnection,
  storeId: string,
  lastSyncDate: string | null = null,
  pageSize: number = 100
): Promise<any[]> {
  try {
    console.log(`Fetching products for store ${storeId}`);
    console.log(`Last sync date for products: ${lastSyncDate}`);
    
    // Set up pagination
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
    
    return allProducts;
  } catch (error) {
    console.error(`Error in fetchProducts: ${error.message}`);
    throw error;
  }
}

/**
 * Stores products in the database
 */
export async function storeProducts(products: any[], storeId: string): Promise<any[]> {
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
    const { data, error } = await supabase
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
    console.error(`Error in storeProducts: ${error.message}`);
    throw error;
  }
}

/**
 * Orchestrates the fetch and storage of product data
 */
export async function syncProducts(
  connection: MagentoConnection,
  storeId: string
): Promise<{ count: number; success: boolean }> {
  try {
    // Get last sync date for products
    const lastSyncDate = await supabase.rpc(
      'get_last_sync_date',
      { 
        store_id_param: storeId,
        data_type_param: 'products'
      }
    ).then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
    
    // Fetch products from Magento
    const products = await fetchProducts(connection, storeId, lastSyncDate);
    
    // Store products in database
    if (products.length > 0) {
      await storeProducts(products, storeId);
    }
    
    // Update last sync date
    await supabase.rpc('update_last_sync_date', {
      store_id_param: storeId,
      data_type_param: 'products',
      sync_date: new Date().toISOString()
    });
    
    console.log(`Successfully synced ${products.length} products`);
    return { count: products.length, success: true };
  } catch (error) {
    console.error(`Error syncing products: ${error.message}`);
    throw error;
  }
}
