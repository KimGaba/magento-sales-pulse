
import { supabase } from '@/integrations/supabase/client';
import { MagentoConnection } from '@/types/magento';

/**
 * Adds a new Magento connection and creates a store if needed
 */
export const addMagentoConnection = async (
  userId: string,
  storeUrl: string,
  apiKey: string,
  storeName: string
): Promise<string> => {
  try {
    console.log(`Adding connection for store: ${storeName}`);
    
    // First create a temporary connection record
    const { data: connectionData, error: connectionError } = await supabase
      .from('magento_connections')
      .insert({
        user_id: userId,
        store_url: storeUrl,
        store_name: storeName,
        access_token: apiKey,
        status: 'pending'
      })
      .select()
      .single();
    
    if (connectionError) {
      console.error("Error creating connection:", connectionError);
      throw connectionError;
    }
    
    // Now test the connection and create the store if successful
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: {
        action: 'test_connection',
        storeUrl: storeUrl,
        accessToken: apiKey,
        connectionId: connectionData.id,
        storeName: storeName,
        userId: userId
      }
    });
    
    if (error || !data.success) {
      console.error("Connection test failed:", error || data.error);
      
      // Clean up the connection if the test failed
      await supabase
        .from('magento_connections')
        .delete()
        .eq('id', connectionData.id);
        
      throw new Error(data?.error || "Connection test failed");
    }
    
    // Return the store ID that was created
    return data.storeId;
    
  } catch (error: any) {
    console.error("Error in addMagentoConnection:", error);
    throw new Error(error.message || "Failed to add Magento connection");
  }
};

/**
 * Triggers a sync of Magento data for a specific store
 */
export const triggerMagentoSync = async (storeId: string): Promise<void> => {
  try {
    console.log(`Triggering sync for store ID: ${storeId}`);
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: {
        storeId: storeId,
        syncType: 'full'
      }
    });
    
    if (error) {
      console.error("Error triggering sync:", error);
      throw error;
    }
    
    if (!data.success) {
      console.error("Sync trigger failed:", data);
      throw new Error(data.error || "Sync trigger failed");
    }
    
    console.log("Sync triggered successfully");
    
  } catch (error) {
    console.error("Error in triggerMagentoSync:", error);
    throw error;
  }
};

/**
 * Fetches Magento connections for a user
 */
export const fetchMagentoConnections = async (userId: string): Promise<MagentoConnection[]> => {
  try {
    console.log(`Fetching connections for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching connections:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchMagentoConnections:", error);
    throw error;
  }
};

/**
 * Fetches unique order statuses from the database
 */
export const fetchOrderStatuses = async (): Promise<string[]> => {
  try {
    console.log("Fetching available order statuses");
    
    // Query directly from transactions table metadata
    const { data, error } = await supabase
      .from('transactions')
      .select('metadata->status')
      .not('metadata->status', 'is', null);
    
    if (error) {
      console.error("Error fetching order statuses:", error);
      throw error;
    }
    
    // Extract unique statuses from the results
    const statuses = data
      .map(item => item.metadata?.status)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    return statuses.length > 0 ? statuses : ["pending", "processing", "complete", "canceled"]; // Fallback to common statuses
  } catch (error) {
    console.error("Error in fetchOrderStatuses:", error);
    return ["pending", "processing", "complete", "canceled"]; // Fallback to common statuses
  }
};
