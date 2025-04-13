
import { supabase } from "../_shared/db_client.ts";
import { MagentoConnection } from "../_shared/database_types.ts";
import { 
  fetchMagentoStoreViews, 
  fetchAllMagentoOrders,
  fetchAndStoreProductData 
} from "./magento_api.ts";
import { storeTransactions } from "./store_transactions.ts";
import { aggregateSalesData } from "./sales_aggregator.ts";
import { recordSyncHistory, getSyncProgress, updateSyncProgress } from "./sync_progress.ts";
import { initializeSync } from "./sync_initializer.ts";

// Main synchronization function
export async function synchronizeMagentoData(options: {
  startPage?: number;
  maxPages?: number;
  changesOnly?: boolean;
  storeId: string;
  connectionId: string;
  useMock?: boolean;
}) {
  try {
    console.log(`Starting Magento sync with options:`, options);
    const { storeId, connectionId, changesOnly = false, useMock = false } = options;
    const startPage = options.startPage || 1;
    const maxPages = options.maxPages || 10;
    
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
      'Fetching store views and initial data'
    );
    
    // First, fetch store views to ensure we have the latest
    try {
      console.log('Fetching store views...');
      await fetchMagentoStoreViews(connection);
    } catch (error) {
      console.error(`Error fetching store views: ${error.message}`);
      // Continue anyway, as this is not critical
    }
    
    // Update sync progress
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      0, 
      0, 
      'Fetching orders from Magento'
    );
    
    // Now, fetch orders
    console.log(`Fetching orders from Magento, pages ${startPage} to ${startPage + maxPages - 1}...`);
    
    // Use the new fetchAllMagentoOrders function
    const ordersResult = await fetchAllMagentoOrders(
      connection,
      maxPages,
      100, // pageSize
      undefined // Use default subscription level logic
    );
    
    // Update progress with total count
    const totalOrders = ordersResult.totalCount;
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      0, 
      totalOrders, 
      `Retrieved ${ordersResult.orders.length} orders from Magento`
    );
    
    // Store the orders as transactions
    console.log(`Storing ${ordersResult.orders.length} orders as transactions...`);
    
    // Update progress
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      0, 
      ordersResult.orders.length, 
      'Storing transactions'
    );
    
    const storeResult = await storeTransactions(ordersResult.orders, storeId);
    
    // Update progress
    const processedCount = storeResult.stats.new + storeResult.stats.updated;
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      processedCount, 
      ordersResult.orders.length, 
      `Stored ${processedCount} transactions`
    );
    
    // Fetch and store product data
    let productsCount = 0;
    try {
      console.log('Fetching products...');
      const products = await fetchAndStoreProductData(connection, storeId, supabase);
      productsCount = products.length;
      console.log(`Stored ${productsCount} products`);
    } catch (error) {
      console.error(`Error fetching products: ${error.message}`);
      // Continue anyway, as this is not critical
    }
    
    // Aggregate sales data
    try {
      console.log('Aggregating sales data...');
      await aggregateSalesData(storeId);
    } catch (error) {
      console.error(`Error aggregating sales data: ${error.message}`);
      // Continue anyway, as this is not critical
    }
    
    // Record sync history
    await recordSyncHistory(
      storeId, 
      processedCount, 
      productsCount, 
      'success'
    );
    
    // Mark sync as complete
    await updateSyncProgress(
      storeId, 
      'completed', 
      processedCount, 
      ordersResult.orders.length, 
      `Sync completed successfully. ${processedCount} transactions processed.`
    );
    
    // Update the last_sync_date on the store
    try {
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_result: 'success'
        })
        .eq('id', storeId);
        
      if (updateError) {
        console.error(`Error updating store last_sync_date: ${updateError.message}`);
      }
    } catch (updateError) {
      console.error(`Error updating store last_sync_date: ${updateError.message}`);
    }
    
    console.log('Magento sync completed successfully');
    
    return {
      success: true,
      stats: {
        ordersCount: ordersResult.orders.length,
        processedCount,
        skippedCount: storeResult.stats.skipped,
        errorCount: storeResult.stats.errors,
        productsCount
      }
    };
  } catch (error) {
    console.error(`Error in synchronizeMagentoData: ${error.message}`);
    
    // Update sync progress to failed
    await updateSyncProgress(
      options.storeId, 
      'failed', 
      0, 
      0, 
      `Sync failed: ${error.message}`
    );
    
    // Record sync history
    await recordSyncHistory(
      options.storeId, 
      0, 
      0, 
      'failed', 
      error.message
    );
    
    // Update the last_sync_date on the store
    try {
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_result: 'failed'
        })
        .eq('id', options.storeId);
        
      if (updateError) {
        console.error(`Error updating store last_sync_date: ${updateError.message}`);
      }
    } catch (updateError) {
      console.error(`Error updating store last_sync_date: ${updateError.message}`);
    }
    
    return { 
      success: false, 
      error: `Sync failed: ${error.message}` 
    };
  }
}

// Re-export the getSyncProgress function for backward compatibility
export { getSyncProgress } from "./sync_progress.ts";
