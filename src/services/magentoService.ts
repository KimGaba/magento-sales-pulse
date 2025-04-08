
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
    
    // First test the connection to make sure it's valid
    const testResult = await testMagentoConnection(normalizedUrl, accessToken);
    
    if (!testResult.success) {
      console.error('Connection test failed:', testResult.error);
      throw new Error(testResult.error || 'Failed to connect to Magento store');
    }
    
    // Check if connection already exists for this user and store URL
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
    console.log(`Updating Magento connection ${connectionId}`, data);
    
    const { error } = await supabase
      .from('magento_connections')
      .update(data)
      .eq('id', connectionId);
      
    if (error) {
      console.error('Error updating Magento connection:', error);
      throw error;
    }
    
    console.log(`Successfully updated connection ${connectionId}`);
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
      
      // Check for specific error types
      if (error.message && error.message.includes('Function not found')) {
        throw new Error('Magento sync function not found or not deployed. Please check your Supabase edge functions.');
      }
      
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
    
    // Normalize storeUrl to ensure it doesn't have a trailing slash
    const normalizedUrl = storeUrl.endsWith('/')
      ? storeUrl.slice(0, -1)
      : storeUrl;
    
    // Call the edge function for testing
    try {
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { 
          action: 'test_connection',
          storeUrl: normalizedUrl,
          accessToken: accessToken
        }
      });
      
      if (error) {
        console.error('Error from edge function:', error);
        
        // Provide more helpful error messages based on common issues
        if (error.message && error.message.includes('401')) {
          throw new Error('Ugyldigt API-token. Kontroller at du har angivet den korrekte API-nøgle.');
        } else if (error.message && error.message.includes('404')) {
          if (error.message.includes('Function not found')) {
            throw new Error('Magento sync function not found or not deployed. Please check your Supabase edge functions.');
          } else {
            throw new Error('Magento API endpoint ikke fundet. Kontroller at URL\'en er korrekt og at Magento REST API er aktiveret.');
          }
        } else if (error.message && error.message.includes('429')) {
          throw new Error('For mange forespørgsler til Magento API. Vent venligst lidt og prøv igen.');
        } else {
          throw error;
        }
      }
      
      return data || { success: true };
    } catch (functionError: any) {
      console.error('Error calling edge function:', functionError);
      
      // Check if this is a "function not found" error
      if (functionError.message && functionError.message.includes('Function not found')) {
        throw new Error('Magento sync function not found or not deployed. Please check your Supabase edge functions.');
      }
      
      throw functionError;
    }
  } catch (error: any) {
    console.error('Error testing Magento connection:', error);
    
    // Check for specific error types to provide more helpful messages
    let errorMessage = 'Fejl ved test af Magento-forbindelse';
    
    if (error.message) {
      if (error.message.includes('API-token') || error.message.includes('API-nøgle')) {
        errorMessage = error.message;
      } else if (error.message.includes('URL')) {
        errorMessage = error.message;
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS-fejl: Magento-serveren tillader ikke adgang fra denne applikation. Kontakt din Magento-administrator.';
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Netværksfejl: Kunne ikke forbinde til Magento-serveren. Kontroller URL og at serveren er online.';
      } else if (error.message.includes('Function not found')) {
        errorMessage = 'Edge function fejl: Magento sync funktion er ikke fundet eller ikke deployet. Kontroller Supabase edge functions.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
};
