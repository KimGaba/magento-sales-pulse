
import { supabase } from '@/integrations/supabase/client';
import { MagentoConnection } from '@/types/magento';

/**
 * Adds a Magento store connection
 */
export const addMagentoConnection = async (
  userId: string,
  storeUrl: string,
  accessToken: string,
  storeName: string
) => {
  try {
    console.log(`Adding Magento connection for user ${userId} to store ${storeName}`);
    
    // Normalize storeUrl to ensure it doesn't have a trailing slash
    const normalizedUrl = storeUrl.endsWith('/')
      ? storeUrl.slice(0, -1)
      : storeUrl;
    
    const { data, error } = await supabase
      .from('magento_connections')
      .insert([
        {
          user_id: userId,
          store_url: normalizedUrl,
          access_token: accessToken,
          store_name: storeName,
          status: 'pending'
        }
      ])
      .select();
    
    if (error) {
      console.error('Error adding Magento connection:', error);
      throw error;
    }
    
    console.log('Successfully added Magento connection:', data);
    return data;
  } catch (error) {
    console.error('Error adding Magento connection:', error);
    throw error;
  }
};

/**
 * Fetches magento connections for a user
 */
export const fetchMagentoConnections = async (userId: string): Promise<MagentoConnection[]> => {
  try {
    console.log(`Fetching Magento connections for user ${userId}`);
    
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching Magento connections:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} Magento connections`);
    return data as MagentoConnection[] || [];
  } catch (error) {
    console.error('Error fetching Magento connections:', error);
    throw error;
  }
};

/**
 * Updates a Magento store connection
 */
export const updateMagentoConnection = async (connectionId: string, data: Partial<MagentoConnection>) => {
  try {
    const { error } = await supabase
      .from('magento_connections')
      .update(data)
      .eq('id', connectionId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating Magento connection:', error);
    throw error;
  }
};

/**
 * Manually triggers synchronization for Magento stores
 */
export const triggerMagentoSync = async (syncType: 'full' | 'changes_only' = 'full', useMock: boolean = false) => {
  try {
    console.log(`Manually triggering Magento synchronization (type: ${syncType}, useMock: ${useMock})`);
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: { 
        trigger: 'manual',
        syncType: syncType,
        useMock: useMock
      }
    });
    
    if (error) {
      console.error('Error triggering Magento sync:', error);
      throw error;
    }
    
    console.log('Magento sync triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error triggering Magento sync:', error);
    throw error;
  }
};

/**
 * Tests a Magento connection by trying to fetch a small amount of data
 */
export const testMagentoConnection = async (storeUrl: string, accessToken: string) => {
  try {
    console.log(`Testing Magento connection to ${storeUrl}`);
    
    // We'll call the Magento API directly here to test the connection
    // Or use a dedicated edge function for testing
    
    // Normalize storeUrl to ensure it doesn't have a trailing slash
    const normalizedUrl = storeUrl.endsWith('/')
      ? storeUrl.slice(0, -1)
      : storeUrl;
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: { 
        action: 'test_connection',
        storeUrl: normalizedUrl,
        accessToken: accessToken
      }
    });
    
    if (error) {
      console.error('Error testing Magento connection:', error);
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error testing Magento connection:', error);
    return { success: false, error: error.message };
  }
};
