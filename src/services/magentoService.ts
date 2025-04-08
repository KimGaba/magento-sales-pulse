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

    // Test forbindelsen først
    const testResult = await testMagentoConnection(normalizedUrl, accessToken);
    if (!testResult.success) {
      console.error('Connection test failed:', testResult.error);
      throw new Error(testResult.error || 'Failed to connect to Magento store');
    }

    // ✅ Ryd gamle forbindelser hvor store_id er NULL
    console.log("🧹 Prøver at rydde tidligere forbindelser uden store_id");
    await supabase
      .from('magento_connections')
      .delete()
      .eq('user_id', userId)
      .eq('store_url', normalizedUrl)
      .is('store_id', null); // korrekt måde at matche null på

    // Tjek om der allerede findes en aktiv forbindelse
    const { data: existingConnections, error: checkError } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('store_url', normalizedUrl);

    if (checkError) {
      console.error('Error checking existing connections:', checkError);
      throw checkError;
    }

    if (existingConnections && existingConnections.length > 0) {
      console.log('Connection already exists for this store URL');
      throw new Error('Der eksisterer allerede en forbindelse til denne Magento butik. Brug en anden URL eller slet den eksisterende forbindelse først.');
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
