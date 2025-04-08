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

    const normalizedUrl = storeUrl.endsWith('/')
      ? storeUrl.slice(0, -1)
      : storeUrl;

  const tempConnectionId = crypto.randomUUID(); // eller lav et midlertidigt ID
const testResult = await testMagentoConnection(
  normalizedUrl,
  accessToken,
  tempConnectionId,
  storeName,
  userId
);

    // ✅ Ryd gamle forbindelser hvor store_id er NULL
    console.log("🧹 Rydder tidligere forbindelser uden store_id");
    await supabase
      .from('magento_connections')
      .delete()
      .eq('user_id', userId)
      .eq('store_url', normalizedUrl)
      .is('store_id', null);

    // Hent eksisterende forbindelser for bruger + URL
    const { data: existingConnections, error: checkError } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('store_url', normalizedUrl);

    if (checkError) {
      console.error('Error checking existing connections:', checkError);
      throw checkError;
    }

    console.log('Found existing connections:', existingConnections);

    // Tjek om der findes en "aktiv" forbindelse (med store_id eller status)
    const hasActiveConnection = existingConnections?.some(
      (conn) => conn.store_id !== null || conn.status === 'active'
    );

    if (hasActiveConnection) {
      console.warn('Connection already exists for this store URL with store_id');
      throw new Error(
        'Der eksisterer allerede en aktiv forbindelse til denne Magento butik. Brug en anden URL eller slet den eksisterende forbindelse først.'
      );
    }

    // Indsæt ny forbindelse
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

    console.log('✅ Successfully added Magento connection:', data);
    return data;
  } catch (error) {
    console.error('❌ Error adding Magento connection:', error);
    throw error;
  }
};

/**
 * Fetches Magento connections for a user
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

    return data || [];
  } catch (error) {
    console.error('Error fetching Magento connections:', error);
    throw error;
  }
};

/**
 * Triggers synchronization for Magento stores
 */
export const triggerMagentoSync = async (
  syncType: 'full' | 'changes_only' = 'full',
  useMock: boolean = false
) => {
  try {
    console.log(`Triggering Magento sync (type: ${syncType}, useMock: ${useMock})`);

    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: {
        trigger: 'manual',
        syncType,
        useMock
      }
    });

    if (error) {
      console.error('Error triggering Magento sync:', error);
      if (error.message?.includes('Function not found')) {
        throw new Error('Magento sync function not found or not deployed.');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error triggering Magento sync:', error);
    throw error;
  }
};

/**
 * Tests a Magento connection by calling the Edge Function
 */
export const testMagentoConnection = async (
  storeUrl: string,
  accessToken: string,
  connectionId: string,
  storeName: string,
  userId: string
) => {
  try {
    const normalizedUrl = storeUrl.endsWith('/') ? storeUrl.slice(0, -1) : storeUrl;

    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: {
        action: 'test_connection',
        storeUrl: normalizedUrl,
        accessToken,
        connectionId,
        storeName,
        userId
      }
    });

    if (error) {
      console.error('Error testing Magento connection:', error);
      return { success: false, error: error.message };
    }

    return data || { success: true };
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Updates a Magento store connection
 */
export const updateMagentoConnection = async (
  connectionId: string,
  data: Partial<MagentoConnection>
) => {
  try {
    console.log(`Updating Magento connection ${connectionId}`, data);

    const { error } = await supabase
      .from('magento_connections')
      .update(data)
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating Magento connection:', error);
      throw error;
    }

    console.log(`✅ Successfully updated connection ${connectionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating Magento connection:', error);
    throw error;
  }
};