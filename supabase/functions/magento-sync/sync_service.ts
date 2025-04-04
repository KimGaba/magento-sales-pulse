
import { supabase } from "./db_operations.ts";
import { fetchMagentoSalesData, fetchAndStoreProductData } from "./magento_api.ts";
import { processDailySalesData, storeTransactions } from "./db_operations.ts";

// Function to synchronize data from Magento
export async function synchronizeMagentoData() {
  console.log("Starting Magento data synchronization");
  
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
      
      // 3. Fetch sales data from Magento
      // Get order statuses to sync from connection settings
      const orderStatuses = connection.order_statuses || ["processing", "complete"];
      console.log(`Using order statuses for sync: ${orderStatuses.join(', ')}`);
      
      const salesData = await fetchMagentoSalesData(connection, orderStatuses);
      
      if (!salesData || !salesData.length) {
        console.log(`No sales data fetched for store ${connection.store_name}`);
        continue;
      }
      
      console.log(`Fetched ${salesData.length} sales records for ${connection.store_name}`);
      
      // 4. Process and store the daily sales aggregated data
      await processDailySalesData(salesData, storeId);
      
      // 5. Store individual transactions
      await storeTransactions(salesData, storeId);
      
      // 6. Fetch and store product data, including images
      await fetchAndStoreProductData(connection, storeId, supabase);
      
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
      message: `Successfully synchronized data for ${connections.length} Magento stores` 
    };
    
  } catch (error) {
    console.error("Error during Magento synchronization:", error);
    return { 
      success: false, 
      message: `Synchronization failed: ${error.message}` 
    };
  }
}
