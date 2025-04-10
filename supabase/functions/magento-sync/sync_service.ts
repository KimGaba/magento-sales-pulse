
import { supabase } from "../_shared/db_client.ts";
import { fetchMagentoOrdersData, fetchMagentoStoreViews, mockMagentoOrdersData } from "./magento_api.ts";
import { storeTransactions } from "./store_transactions.ts";
import { processDailySalesData } from "./sales_aggregator.ts";

interface SyncOptions {
  changesOnly?: boolean;
  useMock?: boolean;
  startPage?: number;
  maxPages?: number;
  storeId?: string;
  connectionId?: string;
}

interface SyncProgress {
  store_id: string;
  connection_id: string;
  current_page: number;
  total_pages: number;
  orders_processed: number;
  total_orders: number;
  status: "in_progress" | "completed" | "error";
  started_at: string;
  updated_at: string;
  error_message?: string;
}

export async function synchronizeMagentoData(options: SyncOptions = {}) {
  const { 
    useMock = false, 
    startPage = 1, 
    maxPages = 10, // Process at most 10 pages per run 
    storeId, 
    connectionId 
  } = options;

  console.log("\n🔄 Starting Magento data synchronization", options);

  let query = supabase.from("magento_connections").select("*").eq("status", "active");
  
  // If we're continuing a sync, only process the specified connection
  if (connectionId) {
    query = query.eq("id", connectionId);
  }

  const { data: connections, error } = await query;

  if (error) {
    console.error("❌ Failed to fetch connections:", error.message);
    return { success: false, error: error.message };
  }

  console.log("🔍 Active connections found:", connections?.length || 0);
  
  if (!connections || connections.length === 0) {
    console.log("ℹ️ No active connections found");
    return { success: true, message: "No connections to process" };
  }

  // Log the first connection for debugging
  if (connections.length > 0) {
    console.log("First connection:", {
      id: connections[0].id,
      store_id: connections[0].store_id,
      store_name: connections[0].store_name,
      status: connections[0].status
    });
  }

  // If we're continuing a sync for a specific store, only process that one
  const connectionsToProcess = storeId 
    ? connections.filter(c => c.store_id === storeId) 
    : connections;

  // Will track if we need to continue syncing after this run
  let continuationNeeded = false;
  let nextConnectionId = null;
  let nextStoreId = null;
  let nextStartPage = 1;

  for (const connection of connectionsToProcess) {
    const currentStoreId = connection.store_id;
    if (!currentStoreId) {
      console.warn(`⚠️ Skipping connection ${connection.id} - missing store_id`);
      continue;
    }

    console.log(`\n🔧 Processing connection for store: ${connection.store_name} (ID: ${currentStoreId})`);

    try {
      // Fetch and store store views for this connection
      try {
        console.log("🏬 Fetching store views for this connection");
        await fetchMagentoStoreViews(connection);
      } catch (storeViewError) {
        console.error("❌ Error fetching store views:", storeViewError.message);
        // Continue with order sync even if store view fetch fails
      }

      // Check if there's an existing progress record for this connection
      const { data: existingProgress, error: progressError } = await supabase
        .from("sync_progress")
        .select("*")
        .eq("connection_id", connection.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (progressError) {
        console.error("❌ Error checking sync progress:", progressError.message);
      }

      // Determine the starting page based on existing progress
      const currentStartPage = existingProgress?.current_page || startPage;
      console.log(`📑 Starting from page ${currentStartPage}`);

      let allOrders: any[] = [];
      let shouldContinue = false;
      let currentPage = currentStartPage;
      let totalCount = 0;
      let progress: SyncProgress | null = null;

      if (useMock) {
        allOrders = await mockMagentoOrdersData();
      } else {
        const pageSize = 100;
        let totalFetched = 0;
        let pagesProcessed = 0;

        // Create or update progress record
        if (existingProgress) {
          // Update existing progress
          progress = existingProgress as SyncProgress;
          progress.updated_at = new Date().toISOString();
        } else {
          // Create new progress record
          progress = {
            store_id: currentStoreId,
            connection_id: connection.id,
            current_page: currentStartPage,
            total_pages: 0, // Will be updated once we know
            orders_processed: 0,
            total_orders: 0, // Will be updated once we know
            status: "in_progress",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Save initial progress
          const { error: saveError } = await supabase
            .from("sync_progress")
            .insert(progress);

          if (saveError) {
            console.error("❌ Error saving sync progress:", saveError.message);
          }
        }

        // Fetch orders page by page, with a limit on how many pages we process per execution
        do {
          console.log(`📦 Fetching Magento orders from ${connection.store_url}, page ${currentPage}`);
          
          try {
            const { orders, totalCount: count } = await fetchMagentoOrdersData(connection, currentPage, pageSize);
            
            // Update the total count if we have it
            if (count && count > 0) {
              totalCount = count;
              if (progress) {
                progress.total_orders = count;
                progress.total_pages = Math.ceil(count / pageSize);
              }
            }
  
            if (!orders.length) break;
  
            allOrders.push(...orders);
            totalFetched += orders.length;
            
            // Update progress
            if (progress) {
              progress.orders_processed = totalFetched;
              progress.current_page = currentPage;
              progress.updated_at = new Date().toISOString();
              
              // Save progress update
              const { error: updateError } = await supabase
                .from("sync_progress")
                .update(progress)
                .eq("connection_id", connection.id)
                .eq("status", "in_progress");
  
              if (updateError) {
                console.error("❌ Error updating sync progress:", updateError.message);
              }
            }
  
            currentPage++;
            pagesProcessed++;
  
            // Check if we've processed the maximum number of pages for this execution
            if (pagesProcessed >= maxPages && totalFetched < totalCount) {
              console.log(`⏸️ Reached maximum pages per execution (${maxPages}). Will resume from page ${currentPage} in next execution.`);
              shouldContinue = true;
              nextConnectionId = connection.id;
              nextStoreId = currentStoreId;
              nextStartPage = currentPage;
              continuationNeeded = true;
              break;
            }
          } catch (fetchError) {
            console.error(`❌ Error fetching page ${currentPage}:`, fetchError);
            
            // Update progress with error
            if (progress) {
              progress.error_message = `Error fetching page ${currentPage}: ${fetchError.message}`;
              progress.updated_at = new Date().toISOString();
              
              const { error: updateError } = await supabase
                .from("sync_progress")
                .update(progress)
                .eq("connection_id", connection.id)
                .eq("status", "in_progress");
  
              if (updateError) {
                console.error("❌ Error updating sync progress with error:", updateError.message);
              }
            }
            
            // Still try to process the orders we've managed to fetch so far
            break;
          }
          
        } while (totalFetched < totalCount && !shouldContinue);
      }

      console.log(`📦 Processing ${allOrders.length} orders for store: ${connection.store_name}`);
      
      // Only process the data if we have any orders
      if (allOrders.length > 0) {
        await storeTransactions(allOrders, currentStoreId);
        await processDailySalesData(allOrders, currentStoreId);
      }

      // If we completed the sync (didn't need to continue), mark progress as completed
      if (!shouldContinue && progress) {
        progress.status = "completed";
        progress.updated_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from("sync_progress")
          .update(progress)
          .eq("connection_id", connection.id);

        if (updateError) {
          console.error("❌ Error updating sync progress to completed:", updateError.message);
        } else {
          console.log(`✅ Marked sync progress as completed for ${connection.store_name}`);
        }
      }

      console.log(`✅ Finished processing ${allOrders.length} orders for ${connection.store_name}`);
      
      // If we need to continue with this store, break out of the loop so we don't process other stores
      if (shouldContinue) {
        break;
      }

    } catch (syncError) {
      console.error(`❌ Error processing orders for ${connection.store_name}:`, syncError);
      
      // Update progress with error
      const { error: updateError } = await supabase
        .from("sync_progress")
        .update({
          status: "error",
          error_message: `Error processing orders: ${syncError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq("connection_id", connection.id)
        .eq("status", "in_progress");

      if (updateError) {
        console.error("❌ Error updating sync progress with error:", updateError.message);
      }
    }
  }

  // If we need to continue syncing, return the information needed for the next run
  if (continuationNeeded) {
    return {
      success: true,
      message: "✅ Partial sync completed. Continuation needed.",
      continuation: {
        connectionId: nextConnectionId,
        storeId: nextStoreId,
        startPage: nextStartPage
      }
    };
  }

  return {
    success: true,
    message: "✅ Magento sync completed"
  };
}

// Function to check sync progress for a specific store
export async function getSyncProgress(storeId: string) {
  try {
    const { data, error } = await supabase
      .from("sync_progress")
      .select("*")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Error fetching sync progress:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, progress: data?.[0] || null };
  } catch (error) {
    console.error("❌ Error in getSyncProgress:", error.message);
    return { success: false, error: error.message };
  }
}
