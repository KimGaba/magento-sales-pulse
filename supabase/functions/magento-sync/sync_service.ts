
import { supabase } from "../_shared/db_client.ts";
import { fetchMagentoOrdersData, fetchMagentoStoreViews } from "./magento_api.ts";
import { storeTransactions } from "./store_transactions.ts";
import { processDailySalesData } from "./sales_aggregator.ts";

interface SyncOptions {
  changesOnly?: boolean;
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
  skipped_orders?: number;
  warning_message?: string;
}

// Check if sync_progress table exists, create it if it doesn't
async function ensureSyncProgressTable() {
  try {
    const { count, error } = await supabase
      .from('sync_progress')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Only attempt table creation if the error is specifically about relation not existing
      if (error.message && error.message.includes('relation "sync_progress" does not exist')) {
        console.log("sync_progress table doesn't exist, attempting to create it");
        // We need the sync_progress table to be created via SQL migration
        console.error("sync_progress table needs to be created via SQL migration");
      } else {
        console.error("Error checking sync_progress table:", error.message);
      }
    } else {
      console.log(`sync_progress table exists with ${count} records`);
    }
  } catch (error) {
    console.error("Error in ensureSyncProgressTable:", error.message);
  }
}

export async function synchronizeMagentoData(options: SyncOptions = {}) {
  const { 
    startPage = 1, 
    maxPages = 10, // Process at most 10 pages per run 
    storeId, 
    connectionId 
  } = options;

  console.log("\n🔄 Starting Magento data synchronization", options);
  
  // Ensure sync_progress table exists
  await ensureSyncProgressTable();

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
      let totalSkippedOrders = existingProgress?.skipped_orders || 0;
      let progress: SyncProgress | null = null;
      let consecutiveEmptyPages = 0;
      const maxConsecutiveEmptyPages = 3; // Stop after 3 consecutive empty pages
      
      // Set up page processing parameters
      const pageSize = 100;
      let totalFetched = 0;
      let pagesProcessed = 0;
      let highSkipRatePages = 0;
      const skipRateThreshold = 0.8; // 80% threshold for high skip rate warning

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
          updated_at: new Date().toISOString(),
          skipped_orders: 0
        };

        // Save initial progress
        try {
          const { error: saveError } = await supabase
            .from("sync_progress")
            .insert(progress);

          if (saveError) {
            console.error("❌ Error saving sync progress:", saveError.message);
          } else {
            console.log("✅ Created initial sync progress record");
          }
        } catch (insertError) {
          console.error("❌ Error creating sync progress:", insertError.message);
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

          // Check for empty results
          if (!orders.length) {
            console.log(`📋 Page ${currentPage} returned 0 orders`);
            consecutiveEmptyPages++;
            
            if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
              console.log(`⚠️ Received ${maxConsecutiveEmptyPages} consecutive empty pages. Assuming end of data.`);
              break;
            }
            
            // Try next page even if this one was empty
            currentPage++;
            pagesProcessed++;
            continue;
          } else {
            // Reset consecutive empty pages counter
            consecutiveEmptyPages = 0;
          }

          // Process this batch of orders
          console.log(`🧮 Processing ${orders.length} orders from page ${currentPage}`);
          
          // Store transactions and get statistics
          const storeResult = await storeTransactions(orders, currentStoreId);
          
          // Track skipped orders for reporting
          const skippedInThisBatch = storeResult.stats.skipped || 0;
          totalSkippedOrders += skippedInThisBatch;
          
          // Check if this page had a high skip rate
          const skipRate = skippedInThisBatch / orders.length;
          if (skipRate >= skipRateThreshold) {
            highSkipRatePages++;
            console.warn(`⚠️ High skip rate on page ${currentPage}: ${Math.round(skipRate * 100)}% of orders skipped (${skippedInThisBatch}/${orders.length})`);
          }
          
          console.log(`📊 Page ${currentPage} results: ${storeResult.stats.new} new, ${storeResult.stats.updated} updated, ${skippedInThisBatch} skipped`);
          
          // Add the successfully processed orders to our collection
          allOrders.push(...orders);
          
          // Count only non-skipped orders toward progress
          const successfullyProcessed = orders.length - skippedInThisBatch;
          totalFetched += successfullyProcessed;
          
          // Update progress
          if (progress) {
            progress.orders_processed = totalFetched;
            progress.current_page = currentPage;
            progress.updated_at = new Date().toISOString();
            progress.skipped_orders = totalSkippedOrders;
            
            // Add warning message if there's a high skip rate
            if (highSkipRatePages > 0) {
              progress.warning_message = `⚠️ ${highSkipRatePages} page(s) had high skip rates. Total ${totalSkippedOrders} orders skipped due to invalid data.`;
            }
            
            // Save progress update
            try {
              const { error: updateError } = await supabase
                .from("sync_progress")
                .update(progress)
                .eq("connection_id", connection.id)
                .eq("status", "in_progress");
  
              if (updateError) {
                console.error("❌ Error updating sync progress:", updateError.message);
              } else {
                console.log(`✅ Updated sync progress: ${totalFetched}/${totalCount} orders processed, ${totalSkippedOrders} skipped`);
              }
            } catch (updateError) {
              console.error("❌ Error updating sync progress:", updateError.message);
            }
          }

          currentPage++;
          pagesProcessed++;

          // Check if we've processed the maximum number of pages for this execution
          if (pagesProcessed >= maxPages && (totalFetched + totalSkippedOrders) < totalCount) {
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
            
            try {
              const { error: updateError } = await supabase
                .from("sync_progress")
                .update(progress)
                .eq("connection_id", connection.id)
                .eq("status", "in_progress");
  
              if (updateError) {
                console.error("❌ Error updating sync progress with error:", updateError.message);
              }
            } catch (updateError) {
              console.error("❌ Error updating sync progress with error:", updateError.message);
            }
          }
          
          // Still try to process the orders we've managed to fetch so far
          console.log(`⚠️ Continuing with ${allOrders.length} orders fetched before the error`);
          break;
        }
        
      } while ((totalFetched + totalSkippedOrders) < totalCount && !shouldContinue);

      console.log(`📦 Processing ${allOrders.length} orders for store: ${connection.store_name}`);
      
      // Only process the data if we have any orders
      if (allOrders.length > 0) {
        await processDailySalesData(allOrders, currentStoreId);
      }

      // If we completed the sync (didn't need to continue), mark progress as completed
      if (!shouldContinue && progress) {
        progress.status = "completed";
        progress.updated_at = new Date().toISOString();
        
        try {
          const { error: updateError } = await supabase
            .from("sync_progress")
            .update(progress)
            .eq("connection_id", connection.id);
  
          if (updateError) {
            console.error("❌ Error updating sync progress to completed:", updateError.message);
          } else {
            console.log(`✅ Marked sync progress as completed for ${connection.store_name}`);
          }
        } catch (updateError) {
          console.error("❌ Error updating sync progress to completed:", updateError.message);
        }
      }

      // Prepare a summary of what happened
      let syncSummary = `✅ Finished processing ${allOrders.length} orders for ${connection.store_name}`;
      if (totalSkippedOrders > 0) {
        syncSummary += `. ${totalSkippedOrders} orders were skipped due to invalid data.`;
      }
      
      console.log(syncSummary);
      
      // If we need to continue with this store, break out of the loop so we don't process other stores
      if (shouldContinue) {
        break;
      }

    } catch (syncError) {
      console.error(`❌ Error processing orders for ${connection.store_name}:`, syncError);
      
      // Update progress with error
      try {
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
      } catch (updateError) {
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
