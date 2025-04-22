// Forbedret version af magentoClient.ts med URL-normalisering
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { MagentoConnection } from "../types.ts";
import logger from "./logger.ts";

const log = logger.createLogger("magentoClient");

/**
 * Normaliserer en URL ved at sikre, at den har protokol og afsluttende skråstreg
 */
export function normalizeUrl(url: string): string {
  let normalizedUrl = url.trim();
  
  // Tilføj protokol hvis det mangler
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  // Tilføj afsluttende skråstreg hvis det mangler
  if (!normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl + '/';
  }
  
  return normalizedUrl;
}

/**
 * Generic function to fetch data from Magento API
 */
export async function fetchFromMagento(connection: MagentoConnection, endpoint: string, params?: Record<string, string>) {
  try {
    // Normaliser store_url for at sikre korrekt URL-konstruktion
    const normalizedStoreUrl = normalizeUrl(connection.store_url);
    
    // Fjern indledende skråstreg fra endpoint hvis den findes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    const url = new URL(cleanEndpoint, normalizedStoreUrl);
    
    // Add query parameters if provided
    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    }
    
    log.info(`Fetching from Magento: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error(`Magento API error: ${response.status} ${response.statusText}`, { error: errorText });
      throw new Error(`Magento API error (${response.status}): ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    log.error(`Error fetching from Magento: ${error.message}`, error as Error);
    throw error;
  }
}

/**
 * Fetch store views from Magento
 */
export async function fetchStoreViews(connection: MagentoConnection): Promise<any[]> {
  try {
    const endpoint = 'rest/all/V1/store/storeViews';
    const data = await fetchFromMagento(connection, endpoint);
    return data;
  } catch (error) {
    log.error(`Error fetching store views: ${error.message}`, error as Error);
    throw error;
  }
}

/**
 * Store store views in Supabase
 */
export async function storeStoreViews(connection: MagentoConnection, storeViews: any[], supabase: any): Promise<void> {
  try {
    // Map the store views to the correct format
    const mappedStoreViews = storeViews.map(storeView => ({
      connection_id: connection.id,
      website_id: storeView.website_id,
      website_name: storeView.website_name,
      store_id: storeView.store_id,
      store_name: storeView.store_name,
      store_view_code: storeView.code,
      store_view_name: storeView.name,
      is_active: storeView.is_active
    }));
    
    // Insert the store views into the database
    const { error } = await supabase
      .from('magento_store_views')
      .upsert(mappedStoreViews, { onConflict: 'connection_id, store_view_code' });
      
    if (error) {
      log.error(`Error storing store views: ${error.message}`, error as Error);
      throw error;
    }
    
    log.info(`Successfully stored ${storeViews.length} store views`);
  } catch (error) {
    log.error(`Error in storeStoreViews: ${error.message}`, error as Error);
    throw error;
  }
}

/**
 * Test Magento connection
 */
export async function testConnection(storeUrl: string, accessToken: string): Promise<{ success: boolean; message?: string; details?: any }> {
  try {
    // Normaliser URL'en for at sikre korrekt format
    const normalizedUrl = normalizeUrl(storeUrl);
    
    log.info(`Testing connection to Magento store: ${normalizedUrl}`);
    
    const url = new URL('rest/all/V1/store/storeViews', normalizedUrl);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error(`Connection test failed: ${response.status} ${response.statusText}`, { error: errorText });
      return { 
        success: false, 
        message: `Forbindelsesfejl: ${response.status} ${response.statusText}`, 
        details: { status: response.status, error: errorText } 
      };
    }
    
    const data = await response.json();
    log.info(`Connection test successful, store views:`, data);
    return { 
      success: true, 
      message: 'Forbindelse testet med succes', 
      details: { storeViews: data.length } 
    };
  } catch (error) {
    log.error(`Error testing connection: ${error.message}`, error as Error);
    return { 
      success: false, 
      message: `Fejl ved test af forbindelse: ${error.message}`,
      details: { error: error.message }
    };
  }
}
