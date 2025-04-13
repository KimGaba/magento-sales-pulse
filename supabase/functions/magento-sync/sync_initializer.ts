
import { supabase } from "../_shared/db_client.ts";
import { MagentoConnection } from "../_shared/database_types.ts";
import { updateSyncProgress } from "./sync_progress.ts";

// Ensure required tables exist
async function ensureTablesExist() {
  try {
    console.log('Checking if required tables exist...');
    
    // Check sync_progress table
    const { data: syncProgressExists, error: syncProgressError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'sync_progress' }
    );
    
    if (syncProgressError) {
      console.error('Error checking if sync_progress table exists:', syncProgressError.message);
      // Continue anyway, we'll try to create it
    }
    
    if (!syncProgressExists) {
      console.log('sync_progress table does not exist, creating it...');
      
      // Create sync_progress table
      const { error: createError } = await supabase.rpc(
        'create_sync_progress_table'
      );
      
      if (createError) {
        console.error('Error creating sync_progress table:', createError.message);
        throw new Error(`Failed to create sync_progress table: ${createError.message}`);
      }
      
      console.log('✅ sync_progress table created successfully');
    } else {
      console.log('✅ sync_progress table already exists');
    }
    
    // Check stores table
    const { data: storesExists, error: storesError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'stores' }
    );
    
    if (storesError) {
      console.error('Error checking if stores table exists:', storesError.message);
      throw new Error(`Failed to check if stores table exists: ${storesError.message}`);
    }
    
    if (!storesExists) {
      console.error('❌ stores table does not exist, this is a critical error');
      throw new Error('The stores table does not exist in the database. Please contact support.');
    } else {
      console.log('✅ stores table exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error.message);
    throw error;
  }
}

// Initialize the sync process by gathering required data
export async function initializeSync(
  storeId: string, 
  connectionId: string
): Promise<{ success: boolean; connection?: MagentoConnection; error?: string }> {
  try {
    console.log(`Initializing sync for store ${storeId} with connection ${connectionId}`);
    
    // First ensure all required tables exist
    try {
      await ensureTablesExist();
    } catch (tableError) {
      console.error(`Error ensuring tables exist: ${tableError.message}`);
      return { 
        success: false, 
        error: `Database setup error: ${tableError.message}` 
      };
    }
    
    // Reset sync progress
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
