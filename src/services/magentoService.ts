import { supabase } from '@/integrations/supabase/client';
import { MagentoConnection } from '@/types/magento';

export const addMagentoConnection = async (
  userId: string,
  storeUrl: string,
  accessToken: string,
  storeName: string
): Promise<string> => {
  try {
    console.log(`Adding Magento connection for user ${userId} to store ${storeName}`);

    const normalizedUrl = storeUrl.endsWith('/')
      ? storeUrl.slice(0, -1)
      : storeUrl;

    // Midlertidigt ID til forbindelsen
    const tempConnectionId = crypto.randomUUID();

    // Opret foreløbig forbindelse med status 'pending' og uden store_id
    const { data: inserted, error: insertError } = await supabase
      .from('magento_connections')
      .insert([
        {
          id: tempConnectionId,
          user_id: userId,
          store_url: normalizedUrl,
          access_token: accessToken,
          store_name: storeName,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting connection:', insertError);
      throw insertError;
    }

    console.log('🧪 Testing connection before activation...');
    // Now we directly use the testMagentoConnection function defined in this file
    const testResult = await testMagentoConnection(
      normalizedUrl,
      accessToken,
      tempConnectionId,
      storeName,
      userId
    );

    if (!testResult.success) {
      console.error('❌ Test connection failed:', testResult.error);

      // Slet den midlertidige forbindelse igen
      await supabase
        .from('magento_connections')
        .delete()
        .eq('id', tempConnectionId);

      throw new Error(testResult.error || 'Connection test failed');
    }

    console.log(`✅ Connection activated and store_id updated: ${testResult.storeId}`);

    // (Optional) Trigger sync nu hvor alt er opdateret
    const { data: syncData, error: syncError } = await supabase.functions.invoke('magento-sync', {
      body: {
        trigger: 'initial_connection'
      }
    });

    if (syncError) {
      console.warn('⚠️ Sync not triggered after connection:', syncError.message);
    } else {
      console.log('✅ Initial sync triggered:', syncData);
    }

    // Return just the store_id instead of the whole connection object
    return testResult.storeId;
  } catch (error) {
    console.error('❌ Error in addMagentoConnection:', error);
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
