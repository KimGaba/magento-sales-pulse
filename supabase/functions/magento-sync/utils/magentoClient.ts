
import { MagentoConnection } from "../types";

/**
 * Generic function to fetch data from the Magento API
 */
export async function fetchFromMagento<T>(
  connection: MagentoConnection,
  endpoint: string, 
  method: string = 'GET', 
  body: any = null
): Promise<T> {
  try {
    // Construct the full URL
    const url = `${connection.store_url}${endpoint}`;
    
    // Set up the request options
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Add body if provided
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Magento API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse and return the response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error in fetchFromMagento: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches store views from Magento
 */
export async function fetchStoreViews(connection: MagentoConnection): Promise<any[]> {
  try {
    return await fetchFromMagento<any[]>(
      connection,
      '/rest/V1/store/storeConfigs'
    );
  } catch (error) {
    console.error(`Error fetching store views: ${error.message}`);
    throw error;
  }
}

/**
 * Tests a Magento connection
 */
export async function testConnection(
  storeUrl: string, 
  accessToken: string
): Promise<{ success: boolean; message?: string; error?: string; storeInfo?: any }> {
  try {
    const apiUrl = `${storeUrl}/rest/V1/store/storeConfigs`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) return { success: false, error: "Ugyldig API-nøgle." };
      if (response.status === 404) return { success: false, error: "Magento API endpoint ikke fundet." };
      if (response.status === 429) return { success: false, error: "For mange forespørgsler." };
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, message: "Forbindelse verificeret", storeInfo: data };
  } catch (error) {
    return { success: false, error: `Magento-forbindelse fejlede: ${error.message}` };
  }
}

/**
 * Store Magento store views in the database
 */
export async function storeStoreViews(
  connection: MagentoConnection, 
  storeViews: any[],
  supabase: any
): Promise<void> {
  if (!storeViews || !Array.isArray(storeViews)) {
    console.warn("No store views to store or invalid format");
    return;
  }
  
  try {
    for (const storeView of storeViews) {
      const { error } = await supabase.from('magento_store_views').upsert({
        connection_id: connection.id,
        website_id: storeView.website_id || '',
        website_name: storeView.name || '',
        store_id: storeView.id || '',
        store_name: storeView.name || '',
        store_view_code: storeView.code || '',
        store_view_name: storeView.name || '',
        is_active: true
      }, {
        onConflict: 'connection_id,store_id'
      });
      
      if (error) {
        console.error(`Error upserting store view: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error storing store views: ${error.message}`);
  }
}
