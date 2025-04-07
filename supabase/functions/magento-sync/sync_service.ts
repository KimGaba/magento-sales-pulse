
import { supabase } from "./db_operations.ts";
import { fetchMagentoOrdersData, mockMagentoOrdersData, fetchAndStoreProductData } from "./magento_api.ts";
import { processDailySalesData, storeTransactions } from "./db_operations.ts";

interface SyncOptions {
  changesOnly?: boolean;
  useMock?: boolean;
}

// Function to synchronize data from Magento
export async function synchronizeMagentoData(options: SyncOptions = {}) {
  const { changesOnly = false, useMock = false } = options;
  
  console.log(`Starting Magento data synchronization (changes only: ${changesOnly}, use mock: ${useMock})`);
  
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
      
      try {
        // 3. Fetch orders data from Magento API
        let ordersData;
        if (useMock) {
          ordersData = await mockMagentoOrdersData();
        } else {
          ordersData = await fetchMagentoOrdersData(connection);
        }
        
        if (!ordersData || !ordersData.length) {
          console.log(`No orders data fetched for store ${connection.store_name}`);
        } else {
          console.log(`Fetched ${ordersData.length} orders for ${connection.store_name}`);
          
          // 4. Process and store the daily sales aggregated data
          await processDailySalesData(ordersData, storeId);
          
          // 5. Store individual transactions
          await storeTransactions(ordersData, storeId);
        }
      } catch (apiError) {
        console.error(`Error processing data for ${connection.store_name}: ${apiError.message}`);
        
        // Update connection status to indicate error
        await supabase
          .from('magento_connections')
          .update({ 
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id);
          
        continue;
      }
      
      // 6. Update connection status and last sync time
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
