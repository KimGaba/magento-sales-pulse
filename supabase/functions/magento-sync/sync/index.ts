
import { supabase, getMagentoConnection, updateSyncProgress, recordSyncHistory } from "../utils/supabaseClient";
import { routeSync, SyncOptions } from "./router.ts"; // Add .ts extension to fix the import
import { fetchStoreViews, storeStoreViews } from "../utils/magentoClient";
import logger from "../utils/logger";

const log = logger.createLogger("sync");

export type SyncRequestOptions = {
  storeId: string;
  connectionId: string;
  syncType?: 'full' | 'changes_only';
  dataType?: string;
  useMock?: boolean;
  maxPages?: number;
  pageSize?: number;
  startPage?: number;
};

/**
 * Initialize the sync process
 */
export async function initializeSync(
  storeId: string, 
  connectionId: string
): Promise<{ success: boolean; connection?: any; error?: string }> {
  try {
    log.info(`Initializing sync for store ${storeId} with connection ${connectionId}`);
    
    // Reset sync progress with the correct connection ID
    await updateSyncProgress(storeId, 'in_progress', 0, 0, 'Initializing sync', connectionId);
    
    // Check for active connection
    const connection = await getMagentoConnection(connectionId);
    
    if (!connection) {
      log.error('No active connection found');
      
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        'No active connection found for this store',
        connectionId
      );
      
      return { 
        success: false, 
        error: 'No active connection found'
      };
    }
    
    // Verify the connection belongs to the store
    if (connection.store_id !== storeId) {
      log.error(`Connection ${connectionId} does not belong to store ${storeId}`);
      
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        `Connection does not belong to this store`,
        connectionId
      );
      
      return { 
        success: false, 
        error: `Connection does not belong to this store`
      };
    }
    
    log.info('Successfully initialized sync with valid connection');
    return { success: true, connection };
  } catch (error) {
    log.error(`Error initializing sync`, error as Error);
    
    try {
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        `Error initializing sync: ${error.message}`,
        connectionId
      );
    } catch (progressError) {
      log.error(`Failed to update sync progress`, progressError as Error);
    }
    
    return { success: false, error: `Error initializing sync: ${error.message}` };
  }
}

/**
 * Main synchronization orchestration function
 */
export async function synchronizeMagentoData(options: SyncRequestOptions): Promise<any> {
  try {
    log.info(`Starting Magento sync`, options);
    const { storeId, connectionId, syncType = 'full' } = options;
    
    // Initialize the sync process
    const initResult = await initializeSync(storeId, connectionId);
    if (!initResult.success || !initResult.connection) {
      return { 
        success: false, 
        error: initResult.error || 'Failed to initialize sync' 
      };
    }
    
    const connection = initResult.connection;
    
    // Update sync progress
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      0, 
      0, 
      'Fetching store views and preparing sync',
      connectionId
    );
    
    // Fetch store views to ensure we have the latest
    try {
      log.info('Fetching store views...');
      const storeViews = await fetchStoreViews(connection);
      await storeStoreViews(connection, storeViews, supabase);
    } catch (error) {
      log.warn(`Error fetching store views: ${error.message}`);
      // Continue anyway, as this is not critical
    }
    
    // Prepare sync options for router
    const routerOptions: SyncOptions = {
      dataType: options.dataType || 'all',
      storeId,
      connectionId,
      maxPages: options.maxPages || 1000,
      pageSize: options.pageSize || 100,
      startPage: options.startPage || 1,
      changesOnly: syncType === 'changes_only'
    };
    
    // Run the sync process via the router
    log.info(`Routing sync to appropriate handler`, { dataType: routerOptions.dataType });
    const result = await routeSync(connection, routerOptions);
    
    // Record sync history
    await recordSyncHistory(
      storeId, 
      result.orders?.stats?.processedCount || 0, 
      result.products?.count || 0, 
      'success'
    );
    
    // Mark sync as complete
    await updateSyncProgress(
      storeId, 
      'completed', 
      result.orders?.stats?.processedCount || 0, 
      result.orders?.stats?.ordersCount || 0, 
      `Sync completed successfully`
    );
    
    // Update the last_sync_date on the store
    try {
      log.info(`Updating last_sync_date for store ${storeId}`);
      
      await supabase
        .from('stores')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_result: 'success'
        })
        .eq('id', storeId);
        
      log.info('Successfully updated last_sync_date');
    } catch (updateError) {
      log.error(`Error updating store last_sync_date: ${updateError.message}`);
    }
    
    log.info('Magento sync completed successfully');
    
    return {
      success: true,
      ...result,
      message: `Sync completed successfully`
    };
  } catch (error) {
    log.error(`Error in synchronizeMagentoData`, error as Error);
    
    // Update sync progress to failed
    try {
      await updateSyncProgress(
        options.storeId, 
        'failed', 
        0, 
        0, 
        `Sync failed: ${error.message}`
      );
    } catch (progressError) {
      log.error(`Error updating sync progress`, progressError as Error);
    }
    
    // Record sync history
    try {
      await recordSyncHistory(
        options.storeId, 
        0, 
        0, 
        'failed', 
        error.message
      );
    } catch (historyError) {
      log.error(`Error recording sync history`, historyError as Error);
    }
    
    // Update the last_sync_date on the store
    try {
      await supabase
        .from('stores')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_result: 'failed'
        })
        .eq('id', options.storeId);
    } catch (updateError) {
      log.error(`Error updating store last_sync_date`, updateError as Error);
    }
    
    return { 
      success: false, 
      error: `Sync failed: ${error.message}` 
    };
  }
}

/**
 * Handle delete connection request
 */
export async function deleteConnection(connectionId: string): Promise<any> {
  try {
    log.info(`Starting deletion process for connection: ${connectionId}`);
    
    // First check if the connection exists
    const { data: connection, error: connectionError } = await supabase
      .from('magento_connections')
      .select('id, store_id, store_name')
      .eq('id', connectionId)
      .maybeSingle();
      
    if (connectionError || !connection) {
      log.error(`Connection not found or error: ${connectionError?.message || 'Not found'}`);
      return { 
        success: false, 
        error: `Forbindelse ikke fundet: ${connectionError?.message || 'Ikke fundet'}` 
      };
    }
    
    log.info(`Found connection: ${connection.id}, store_id: ${connection.store_id || 'None'}`);
    
    // If we have a store_id, delete all related data using the delete_store_data function
    if (connection.store_id) {
      log.info(`Using delete_store_data function for store_id: ${connection.store_id}`);
      const { error } = await supabase.rpc('delete_store_data', {
        target_store_id: connection.store_id
      });
      
      if (error) {
        log.error(`Error deleting store data: ${error.message}`);
        throw error;
      }
      
      log.info(`Successfully deleted store data for store_id: ${connection.store_id}`);
      return { success: true, message: `Butik "${connection.store_name}" blev slettet` };
    } 
    else {
      // If no store_id, just delete the connection directly
      log.info(`No store_id found, deleting connection directly: ${connection.id}`);
      
      // First delete any related data - sync_progress
      const { error: syncError } = await supabase
        .from('sync_progress')
        .delete()
        .eq('connection_id', connection.id);
        
      if (syncError) {
        log.error(`Error deleting sync progress: ${syncError.message}`);
        // Continue anyway, non-critical
      }
      
      // Delete any store views
      const { error: viewsError } = await supabase
        .from('magento_store_views')
        .delete()
        .eq('connection_id', connection.id);
        
      if (viewsError) {
        log.error(`Error deleting store views: ${viewsError.message}`);
        // Continue anyway, non-critical
      }
      
      // Finally delete the connection
      const { error: deleteError } = await supabase
        .from('magento_connections')
        .delete()
        .eq('id', connection.id);
        
      if (deleteError) {
        log.error(`Error deleting connection: ${deleteError.message}`);
        throw deleteError;
      }
      
      log.info(`Successfully deleted connection: ${connection.id}`);
      return { 
        success: true, 
        message: `Forbindelsen "${connection.store_name}" blev slettet`
      };
    }
  } catch (error) {
    log.error(`Error in deleteConnection: ${error.message}`);
    return { 
      success: false, 
      error: `Kunne ikke slette forbindelsen: ${error.message}` 
    };
  }
}
