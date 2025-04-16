
import { supabase } from "../utils/supabaseClient.ts";
import logger from "../utils/logger.ts";
import { MagentoConnection } from "../types.ts";
import { updateSyncProgress } from "../utils/supabaseClient.ts";
import { syncProducts } from "../modules/products.ts";
import { syncOrders } from "../modules/orders.ts";
import { syncCustomers } from "../modules/customers.ts";

const log = logger.createLogger("sync-router");

export type SyncOptions = {
  dataType: string;
  storeId: string;
  connectionId: string;
  maxPages?: number;
  pageSize?: number;
  startPage?: number;
  changesOnly?: boolean;
};

/**
 * Route the sync request to the appropriate module
 */
export async function routeSync(
  connection: MagentoConnection,
  options: SyncOptions
): Promise<any> {
  log.info(`Routing sync for data type: ${options.dataType}`, { 
    storeId: options.storeId, 
    connectionId: options.connectionId
  });
  
  try {
    switch (options.dataType) {
      case 'products':
        return await syncProducts(connection, options.storeId);
        
      case 'orders':
        return await syncOrders(
          connection, 
          options.storeId, 
          options.maxPages, 
          options.pageSize
        );
        
      case 'customers':
        return await syncCustomers(connection, options.storeId);
        
      case 'all':
        // Sync all data types
        log.info('Running full sync');
        
        await updateSyncProgress(
          options.storeId,
          'in_progress',
          0,
          0,
          'Starting full sync',
          options.connectionId
        );
        
        const productsResult = await syncProducts(connection, options.storeId);
        log.info(`Products sync completed`, { count: productsResult.count });
        
        const ordersResult = await syncOrders(
          connection, 
          options.storeId, 
          options.maxPages, 
          options.pageSize
        );
        log.info(`Orders sync completed`, { stats: ordersResult.stats });
        
        // Update store last_sync_date
        await supabase
          .from('stores')
          .update({ 
            last_sync_date: new Date().toISOString(),
            last_sync_result: 'success'
          })
          .eq('id', options.storeId);
        
        return {
          success: true,
          products: productsResult,
          orders: ordersResult,
          message: 'Full sync completed successfully'
        };
        
      default:
        log.warn(`Unknown data type: ${options.dataType}`);
        throw new Error(`Unknown data type: ${options.dataType}`);
    }
  } catch (error) {
    log.error(`Error in routeSync for ${options.dataType}`, error as Error);
    
    // Update sync progress to failed
    await updateSyncProgress(
      options.storeId, 
      'failed', 
      0, 
      0, 
      `Sync failed: ${error.message}`,
      options.connectionId
    );
    
    throw error;
  }
}

/**
 * Delete a Magento connection and all associated data
 */
export async function deleteConnection(connectionId: string) {
  try {
    log.info(`Starting deletion process for connection: ${connectionId}`);
    
    // First, fetch the connection to check if it has a store_id
    const { data: connection, error: fetchError } = await supabase
      .from("magento_connections")
      .select("store_id")
      .eq("id", connectionId)
      .maybeSingle();
      
    if (fetchError) {
      log.error(`Error fetching connection: ${fetchError.message}`);
      return { 
        success: false, 
        error: `Error fetching connection: ${fetchError.message}` 
      };
    }
    
    if (!connection) {
      log.error(`Connection ${connectionId} not found`);
      return { 
        success: false, 
        error: "Connection not found" 
      };
    }
    
    // If connection has a store_id, delete all store-related data first
    if (connection.store_id) {
      log.info(`Deleting data for store_id: ${connection.store_id}`);
      try {
        // Use the database function to delete all store-related data
        const { error: rpcError } = await supabase.rpc(
          'delete_store_data', 
          { target_store_id: connection.store_id }
        );
        
        if (rpcError) {
          log.error(`Error deleting store data: ${rpcError.message}`);
          // Continue with connection deletion even if this fails
          log.info("Continuing with connection deletion despite store data deletion error");
        }
      } catch (storeError) {
        log.error(`Exception deleting store data: ${storeError.message}`, storeError as Error);
        // Continue with connection deletion even if this fails
        log.info("Continuing with connection deletion despite store data deletion error");
      }
    } else {
      // For connections without a store_id, log and delete just the connection
      log.info(`Deleting connection ${connectionId} without a store_id`);
    }
    
    // Delete the connection itself
    const { error: deleteError } = await supabase
      .from("magento_connections")
      .delete()
      .eq("id", connectionId);
    
    if (deleteError) {
      log.error(`Error deleting connection: ${deleteError.message}`);
      return { 
        success: false, 
        error: `Error deleting connection: ${deleteError.message}` 
      };
    }
    
    log.info(`Connection ${connectionId} deleted successfully`);
    return { 
      success: true, 
      message: "Forbindelsen blev slettet" 
    };
  } catch (error) {
    log.error(`Unexpected error in deleteConnection: ${error.message}`, error as Error);
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}` 
    };
  }
}
