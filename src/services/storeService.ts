
import { supabase } from '@/integrations/railway/client';

/**
 * Fetches stores that a user has access to
 */
export const getStoresForUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('magento_connections')
      .select('store_id, stores:store_id(id, name, url)')
      .eq('user_id', userId)
      .not('store_id', 'is', null);
    
    if (error) {
      console.error('Error fetching stores for user:', error);
      throw error;
    }
    
    // Extract store data from the joined results
    const stores = data
      .filter(item => item.stores) // Filter out null stores
      .map(item => item.stores);
    
    return stores;
  } catch (error) {
    console.error('Error in getStoresForUser:', error);
    return [];
  }
};

/**
 * Fetch store data - for backward compatibility
 */
export const fetchStoreData = async (userId: string) => {
  return getStoresForUser(userId);
};

export const createStore = async (name: string, url?: string) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .insert({ name, url })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating store:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createStore:', error);
    throw error;
  }
};

export const updateStore = async (id: string, updates: { name?: string; url?: string }) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating store:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateStore:', error);
    throw error;
  }
};

export const deleteStore = async (id: string) => {
  try {
    // Use the database function delete_store_data to clean up all related data
    const { error } = await supabase.rpc('delete_store_data', { target_store_id: id });
    
    if (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteStore:', error);
    throw error;
  }
};
