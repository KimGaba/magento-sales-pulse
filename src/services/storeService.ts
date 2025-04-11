
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches store data for a user
 */
export const fetchStoreData = async () => {
  const { data, error } = await supabase.from('stores').select('*');
  
  if (error) {
    console.error('Error fetching store data:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Gets stores that a user has access to
 */
export const getStoresForUser = async (userId: string): Promise<any[]> => {
  try {
    // Get connections for the user
    const { data: connections, error: connectionsError } = await supabase
      .from('magento_connections')
      .select('store_id')
      .eq('user_id', userId)
      .not('store_id', 'is', null);
    
    if (connectionsError) {
      console.error('Error fetching user connections:', connectionsError);
      throw connectionsError;
    }
    
    if (!connections || connections.length === 0) {
      return [];
    }
    
    // Extract store IDs from connections
    const storeIds = connections.map(conn => conn.store_id).filter(Boolean);
    
    if (storeIds.length === 0) {
      return [];
    }
    
    // Get store details
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .in('id', storeIds);
    
    if (storesError) {
      console.error('Error fetching stores:', storesError);
      throw storesError;
    }
    
    return stores || [];
  } catch (error) {
    console.error('Error in getStoresForUser:', error);
    throw error;
  }
};
