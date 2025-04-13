
import { supabase } from "../_shared/db_client.ts";
import { MagentoConnection } from "../_shared/database_types.ts";
import { updateSyncProgress } from "./sync_progress.ts";

// Initialize the sync process by gathering required data
export async function initializeSync(
  storeId: string, 
  connectionId: string
): Promise<{ success: boolean; connection?: MagentoConnection; error?: string }> {
  try {
    console.log(`Initializing sync for store ${storeId} with connection ${connectionId}`);
    
    // Reset sync progress - assume the table exists
    await updateSyncProgress(storeId, 'in_progress', 0, 0, 'Initializing sync');
    
    // Check for active connection
    const { data: connection, error: connectionError } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (connectionError || !connection) {
      console.error('No active connection found:', connectionError?.message || 'Connection not found');
      
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        'No active connection found for this store'
      );
      
      return { 
        success: false, 
        error: `No active connection found: ${connectionError?.message || 'Connection not found'}`
      };
    }
    
    // Verify the connection belongs to the store
    if (connection.store_id !== storeId) {
      console.error(`Connection ${connectionId} does not belong to store ${storeId}`);
      
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        `Connection does not belong to this store`
      );
      
      return { 
        success: false, 
        error: `Connection does not belong to this store`
      };
    }
    
    console.log('Successfully initialized sync with valid connection');
    return { success: true, connection };
  } catch (error) {
    console.error(`Error initializing sync: ${error.message}`);
    
    try {
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        `Error initializing sync: ${error.message}`
      );
    } catch (progressError) {
      console.error(`Failed to update sync progress: ${progressError.message}`);
    }
    
    return { success: false, error: `Error initializing sync: ${error.message}` };
  }
}
