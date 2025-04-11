
import { MagentoConnection } from "../_shared/database_types.ts";
import { supabase } from "../_shared/db_client.ts";

// Function to fetch orders from Magento API
export async function fetchMagentoOrdersData(connection: MagentoConnection, page = 1, pageSize = 100) {
  try {
    console.log(`📦 Fetching Magento orders from ${connection.store_url}, page ${page}`);
    const url = `${connection.store_url}/rest/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}`;

    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.items || [];
    return {
      orders: orders.map((order: any) => ({
        external_id: order.increment_id,
        transaction_date: order.created_at,
        amount: parseFloat(order.grand_total),
        customer_id: order.customer_email,
        customer_name: order.customer_firstname ? `${order.customer_firstname} ${order.customer_lastname || ''}` : 'Guest Customer',
        store_view: order.store_id || 'default',
        customer_group: order.customer_group_id?.toString() || 'none',
        status: order.status,
        items: order.items?.length || 0,
        // Include full order items array
        items_data: order.items || [],
        order_data: {
          payment_method: order.payment?.method || 'unknown',
          shipping_method: order.shipping_description || 'unknown'
        }
      })),
      totalCount: data.total_count || orders.length
    };
  } catch (error) {
    console.error(`❌ Error fetching Magento orders: ${error.message}`);
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

    const storeViews = await response.json();
    
    // Also fetch websites for more context
    const websitesUrl = `${connection.store_url}/rest/V1/store/websites`;
    const websitesResponse = await fetch(websitesUrl, { method: 'GET', headers });
    const websites = await websitesResponse.json();
    
    // Create a mapping of website IDs to names
    const websiteMap = {};
    websites.forEach((website: any) => {
      websiteMap[website.id] = website.name;
    });
    
    // Store the store views in the database
    for (const view of storeViews) {
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
    }
    
    return storeViews;
  } catch (error) {
    console.error(`❌ Error fetching or storing Magento store views: ${error.message}`);
    throw error;
  }
}

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
    }

    return products;
  } catch (error) {
    console.error(`❌ Error fetching or storing Magento products: ${error.message}`);
    throw error;
  }
}
