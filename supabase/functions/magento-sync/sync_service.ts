
import { supabase } from "../_shared/db_client.ts";
import { MagentoConnection } from "../_shared/database_types.ts";
import { 
  fetchMagentoStoreViews, 
  fetchAllMagentoOrders,
  fetchAndStoreProductData 
} from "./magento_api.ts";
import { storeTransactions } from "./store_transactions.ts";
import { aggregateSalesData } from "./sales_aggregator.ts";

// Record sync history for tracking and reporting
async function recordSyncHistory(
  storeId: string, 
  ordersCount: number, 
  productsCount: number, 
  status: string, 
  error?: string
) {
  try {
    const syncHistoryData = {
      store_id: storeId,
      orders_synced: ordersCount,
      products_synced: productsCount,
      sync_date: new Date().toISOString(),
      status: status,
      error_message: error || null
    };
    
    const { error: insertError } = await supabase
      .from('sync_history')
      .insert(syncHistoryData);
      
    if (insertError) {
      console.error(`Failed to record sync history: ${insertError.message}`);
    }
  } catch (error) {
    console.error(`Error in recordSyncHistory: ${error.message}`);
  }
}

// Get the sync progress for a store
export async function getSyncProgress(storeId: string) {
  try {
    console.log(`Getting sync progress for store: ${storeId}`);
    
    // Check if the sync_progress table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'sync_progress' }
    );
    
    if (tableCheckError) {
      console.error('Error checking if sync_progress table exists:', tableCheckError.message);
      return { 
        success: false, 
        error: 'Could not check if sync_progress table exists',
        inProgress: false
      };
    }
    
    if (!tableExists) {
      console.log('sync_progress table does not exist yet');
      return { success: true, inProgress: false };
    }
    
    // Fetch the latest sync progress
    const { data, error } = await supabase
      .from('sync_progress')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error(`Error fetching sync progress: ${error.message}`);
      return { 
        success: false, 
        error: `Failed to fetch sync progress: ${error.message}`,
        inProgress: false
      };
    }
    
    // If no progress record exists
    if (!data) {
      return { success: true, inProgress: false };
    }
    
    // Check if the sync is still in progress
    const isInProgress = data.status === 'in_progress';
    
    // If sync is in progress, but it's older than 15 minutes, assume it's stale
    if (isInProgress) {
      const updatedAt = new Date(data.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      
      if (diffMinutes > 15) {
        console.log(`Sync progress is stale (${diffMinutes.toFixed(1)} minutes old), marking as failed`);
        
        // Update the record to mark it as failed
        await supabase
          .from('sync_progress')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            notes: 'Sync timed out after 15 minutes of inactivity'
          })
          .eq('id', data.id);
          
        return { 
          success: true, 
          inProgress: false, 
          isStale: true,
          lastSync: data
        };
      }
    }
    
    return {
      success: true,
      inProgress: isInProgress,
      progress: data
    };
  } catch (error) {
    console.error(`Error in getSyncProgress: ${error.message}`);
    return { 
      success: false, 
      error: `Failed to get sync progress: ${error.message}`,
      inProgress: false
    };
  }
}

// Update the sync progress
async function updateSyncProgress(
  storeId: string, 
  status: string, 
  current: number, 
  total: number, 
  notes?: string
) {
  try {
    // Check if we already have a progress record for this store
    const { data: existing, error: fetchError } = await supabase
      .from('sync_progress')
      .select('id')
      .eq('store_id', storeId)
      .eq('status', 'in_progress')
      .maybeSingle();
      
    if (fetchError) {
      console.error(`Error fetching sync progress: ${fetchError.message}`);
      return;
    }
    
    const progressData = {
      store_id: storeId,
      status,
      current_count: current,
      total_count: total,
      updated_at: new Date().toISOString(),
      notes: notes || null
    };
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('sync_progress')
        .update(progressData)
        .eq('id', existing.id);
        
      if (updateError) {
        console.error(`Error updating sync progress: ${updateError.message}`);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('sync_progress')
        .insert(progressData);
        
      if (insertError) {
        console.error(`Error inserting sync progress: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error(`Error in updateSyncProgress: ${error.message}`);
  }
}

// Initialize the sync process by gathering required data
async function initializeSync(
  storeId: string, 
  connectionId: string
): Promise<{ success: boolean; connection?: MagentoConnection; error?: string }> {
  try {
    console.log(`Initializing sync for store ${storeId} with connection ${connectionId}`);
    
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
    
    await updateSyncProgress(
      storeId, 
      'failed', 
      0, 
      0, 
      `Error initializing sync: ${error.message}`
    );
    
    return { success: false, error: `Error initializing sync: ${error.message}` };
  }
}

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
