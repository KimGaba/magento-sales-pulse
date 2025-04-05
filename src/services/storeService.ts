
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all store data
 */
export const fetchStoreData = async () => {
  try {
    console.log('Fetching stores');
    
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, url, created_at, updated_at')
      .order('name');
    
    if (error) {
      console.error('Error fetching store data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} stores`);
    return data || [];
  } catch (error) {
    console.error('Error fetching store data:', error);
    throw error;
  }
};
