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
      'Fetching store views and initial data',
      connectionId
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
      'Fetching orders from Magento',
      connectionId
    );
    
    // Now, fetch orders with improved error handling
    console.log(`Fetching orders from Magento, pages ${startPage} to ${startPage + maxPages - 1}...`);
    
    let ordersResult;
    try {
      // Use the fetchAllMagentoOrders function with error handling
      ordersResult = await fetchAllMagentoOrders(
        connection,
        maxPages,
        100, // pageSize
        undefined // Use default subscription level logic
      );
      
      // Validate totalCount - we now use the actual number of orders we've fetched
      console.log(`Fetched ${ordersResult.orders.length} orders. Using this as our total count.`);
    } catch (fetchError) {
      console.error(`Failed to fetch orders: ${fetchError.message}`);
      
      // Update progress with failure information
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        0, 
        `Failed to fetch orders: ${fetchError.message}`,
        connectionId
      );
      
      // Record sync history
      await recordSyncHistory(
        storeId, 
        0, 
        0, 
        'failed', 
        `Failed to fetch orders: ${fetchError.message}`
      );
      
      return {
        success: false,
        error: `Failed to fetch orders: ${fetchError.message}`
      };
    }
    
    // Check if we got any orders
    if (!ordersResult.orders || ordersResult.orders.length === 0) {
      console.log('No orders found for the specified criteria');
      
      // Update progress
      await updateSyncProgress(
        storeId, 
        'completed', 
        0, 
        0, 
        'No orders found for the specified criteria',
        connectionId
      );
      
      // Record sync history
      await recordSyncHistory(
        storeId, 
        0, 
        0, 
        'success', 
        'No orders found'
      );
      
      try {
        // Update the last_sync_date on the store to show we at least tried
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
      
      return {
        success: true,
        stats: {
          ordersCount: 0,
          processedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          productsCount: 0
        },
        message: 'No orders found for the specified criteria'
      };
    }
    
    // Update progress with total count of orders we actually fetched
    const totalOrders = ordersResult.orders.length;
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      0, 
      totalOrders, 
      `Retrieved ${ordersResult.orders.length} orders from Magento`,
      connectionId
    );
    
    // Store the orders as transactions with error handling
    console.log(`Storing ${ordersResult.orders.length} orders as transactions...`);
    
    let storeResult;
    try {
      // Update progress
      await updateSyncProgress(
        storeId, 
        'in_progress', 
        0, 
        ordersResult.orders.length, 
        'Storing transactions',
        connectionId
      );
      
      storeResult = await storeTransactions(ordersResult.orders, storeId);
      
      // Log transaction storage results
      console.log(`Transaction storage results: ${storeResult.stats.new} new, ${storeResult.stats.updated} updated, ${storeResult.stats.skipped} skipped, ${storeResult.stats.errors} errors`);
    } catch (storeError) {
      console.error(`Failed to store transactions: ${storeError.message}`);
      
      // Update progress with failure information
      await updateSyncProgress(
        storeId, 
        'failed', 
        0, 
        ordersResult.orders.length, 
        `Failed to store transactions: ${storeError.message}`,
        connectionId
      );
      
      // Record sync history
      await recordSyncHistory(
        storeId, 
        0, 
        0, 
        'failed', 
        `Failed to store transactions: ${storeError.message}`
      );
      
      return {
        success: false,
        error: `Failed to store transactions: ${storeError.message}`
      };
    }
    
    // Update progress
    const processedCount = storeResult.stats.new + storeResult.stats.updated;
    await updateSyncProgress(
      storeId, 
      'in_progress', 
      processedCount, 
      ordersResult.orders.length, 
      `Stored ${processedCount} transactions`,
      connectionId
    );
    
    // Fetch and store product data with error handling
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
    
    // Aggregate sales data with error handling
    try {
      console.log('Aggregating sales data...');
      await aggregateSalesData(storeId);
      console.log('Sales data aggregation complete');
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
    
    // Update the last_sync_date on the store with error handling
    try {
      console.log(`Updating last_sync_date for store ${storeId}`);
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_result: 'success'
        })
        .eq('id', storeId);
        
      if (updateError) {
        console.error(`Error updating store last_sync_date: ${updateError.message}`);
      } else {
        console.log('Successfully updated last_sync_date');
      }
    } catch (updateError) {
      console.error(`Error updating store last_sync_date: ${updateError.message}`, updateError);
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
      },
      message: `Sync completed successfully. ${processedCount} transactions processed.`
    };
  } catch (error) {
    console.error(`Error in synchronizeMagentoData: ${error.message}`);
    
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
      console.error(`Error updating sync progress: ${progressError.message}`);
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
      console.error(`Error recording sync history: ${historyError.message}`);
    }
    
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
