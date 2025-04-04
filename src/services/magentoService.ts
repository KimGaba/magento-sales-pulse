
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
    
    const { data, error } = await supabase
      .from('magento_connections')
      .insert([
        {
          user_id: userId,
          store_url: storeUrl,
          access_token: accessToken,
          store_name: storeName,
          status: 'active'
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
export const triggerMagentoSync = async () => {
  try {
    console.log('Manually triggering Magento synchronization');
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: { trigger: 'manual' }
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
