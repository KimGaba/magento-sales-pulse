
import { MagentoConnection } from "../types";
import { supabase, updateSyncProgress } from "../utils/supabaseClient";
import { syncProducts } from "../modules/products";
import { syncOrders } from "../modules/orders";
import { syncCustomers } from "../modules/customers";
import logger from "../utils/logger";

const log = logger.createLogger("router");

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
