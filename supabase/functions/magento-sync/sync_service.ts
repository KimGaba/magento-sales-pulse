
import { supabase } from "./db_operations.ts";
import { fetchMagentoSalesData, fetchAndStoreProductData } from "./magento_api.ts";
import { processDailySalesData, storeTransactions } from "./db_operations.ts";

interface SyncOptions {
  changesOnly?: boolean;
}

// Function to synchronize data from Magento
export async function synchronizeMagentoData(options: SyncOptions = {}) {
  const { changesOnly = false } = options;
  
  console.log(`Starting Magento data synchronization (changes only: ${changesOnly})`);
  
  try {
    // 1. Get all active Magento connections
    const { data: connections, error: connectionsError } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('status', 'active');
    
    if (connectionsError) {
      throw new Error(`Error fetching Magento connections: ${connectionsError.message}`);
    }
    
    if (!connections || connections.length === 0) {
      console.log("No active Magento connections found. Exiting.");
      return { success: true, message: "No active connections to process" };
    }
    
    console.log(`Found ${connections.length} active Magento connections`);
    
    // Process each connection
    for (const connection of connections) {
      console.log(`Processing connection for store: ${connection.store_name}`);
      
      // 2. Initialize the store in our database if it doesn't exist yet
      let storeId = connection.store_id;
      
      if (!storeId) {
        // Create a new store record
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .insert({
            name: connection.store_name,
            url: connection.store_url
          })
          .select()
          .single();
        
        if (storeError) {
          console.error(`Error creating store for ${connection.store_name}: ${storeError.message}`);
          continue;
        }
        
        storeId = storeData.id;
        
        // Update the connection with the new store_id
        await supabase
          .from('magento_connections')
          .update({ store_id: storeId })
          .eq('id', connection.id);
          
        console.log(`Created new store with ID: ${storeId}`);
      }
      
      // 3. Fetch sales data from Magento - use changesOnly parameter to determine sync behavior
      // Use default order statuses
      const defaultOrderStatuses = ["processing", "complete"];
      console.log(`Using default order statuses for sync: ${defaultOrderStatuses.join(', ')}`);
      
      if (!changesOnly) {
        // Full sync
        const salesData = await fetchMagentoSalesData(connection, defaultOrderStatuses);
        
        if (!salesData || !salesData.length) {
          console.log(`No sales data fetched for store ${connection.store_name}`);
        } else {
          console.log(`Fetched ${salesData.length} sales records for ${connection.store_name}`);
          
          // 4. Process and store the daily sales aggregated data
          await processDailySalesData(salesData, storeId);
          
          // 5. Store individual transactions
          await storeTransactions(salesData, storeId);
        }
      } else {
        // Only fetch changes
        console.log(`Fetching only recent changes for ${connection.store_name}`);
        
        // Get the last sync time to only fetch data since then
        const lastSyncTime = new Date(connection.updated_at);
        const salesData = await fetchMagentoSalesData(
          connection, 
          defaultOrderStatuses, 
          lastSyncTime
        );
        
        if (!salesData || !salesData.length) {
          console.log(`No new sales data since last sync for store ${connection.store_name}`);
        } else {
          console.log(`Fetched ${salesData.length} new sales records for ${connection.store_name}`);
          
          // Process only new data
          await processDailySalesData(salesData, storeId);
          await storeTransactions(salesData, storeId);
        }
      }
      
      // 6. Fetch and store product data, including images
      if (!changesOnly || Math.random() < 0.2) { // For changes_only, only update products 20% of the time
        await fetchAndStoreProductData(connection, storeId, supabase);
      } else {
        console.log("Skipping product sync for changes_only request");
      }
      
      // 7. Update connection status and last sync time
      await supabase
        .from('magento_connections')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
      
      console.log(`Completed synchronization for ${connection.store_name}`);
    }
    
    return { 
      success: true, 
      message: `Successfully synchronized ${changesOnly ? 'changes for' : 'data for'} ${connections.length} Magento stores` 
    };
    
  } catch (error) {
    console.error("Error during Magento synchronization:", error);
    return { 
      success: false, 
      message: `Synchronization failed: ${error.message}` 
    };
  }
}
