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

async function ensureSyncProgressTable() {
  try {
    const { count, error } = await supabase
      .from('sync_progress')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message && error.message.includes('relation "sync_progress" does not exist')) {
        console.log("sync_progress table doesn't exist, attempting to create it");
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
    maxPages = 10, 
    storeId, 
    connectionId,
    changesOnly = false
  } = options;

  console.log("\n🔄 Starting Magento data synchronization", options);
  
  await ensureSyncProgressTable();

  let query = supabase.from("magento_connections").select("*").eq("status", "active");
  
  if (connectionId) {
    query = query.eq("id", connectionId);
  }

  if (storeId) {
    query = query.eq("store_id", storeId);
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

  if (connections.length > 0) {
    console.log("First connection:", {
      id: connections[0].id,
      store_id: connections[0].store_id,
      store_name: connections[0].store_name,
      status: connections[0].status
    });
  }

  let continuationNeeded = false;
  let nextConnectionId = null;
  let nextStoreId = null;
  let nextStartPage = 1;

  for (const connection of connections) {
    const currentStoreId = connection.store_id;
    if (!currentStoreId) {
      console.warn(`⚠️ Skipping connection ${connection.id} - missing store_id`);
      continue;
    }

    console.log(`\n🔧 Processing connection for store: ${connection.store_name} (ID: ${currentStoreId})`);

    try {
      try {
        console.log("🏬 Fetching store views for this connection");
        await fetchMagentoStoreViews(connection);
      } catch (storeViewError) {
        console.error("❌ Error fetching store views:", storeViewError.message);
      }

      const { data: existingProgress, error: progressError } = await supabase
        .from("sync_progress")
        .select("*")
        .eq("connection_id", connection.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (progressError) {
        console.error("❌ Error checking sync progress:", progressError.message);
      }

      const currentStartPage = existingProgress?.current_page || startPage;
      console.log(`📑 Starting from page ${currentStartPage}`);

      let allOrders: any[] = [];
      let shouldContinue = false;
      let currentPage = currentStartPage;
      let totalCount = 0;
      let totalSkippedOrders = existingProgress?.skipped_orders || 0;
      let outsideWindowOrders = 0;
      let progress: SyncProgress | null = null;
      let consecutiveEmptyPages = 0;
      const maxConsecutiveEmptyPages = 3;

      const pageSize = 100;
      let totalFetched = 0;
      let pagesProcessed = 0;
      let highSkipRatePages = 0;
      const skipRateThreshold = 0.8;

      if (existingProgress) {
        progress = existingProgress as SyncProgress;
        progress.updated_at = new Date().toISOString();
      } else {
        progress = {
          store_id: currentStoreId,
          connection_id: connection.id,
          current_page: currentStartPage,
          total_pages: 0,
          orders_processed: 0,
          total_orders: 0,
          status: "in_progress",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          skipped_orders: 0
        };

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

      do {
        console.log(`📦 Fetching Magento orders from ${connection.store_url}, page ${currentPage}`);
        
        try {
          const { orders, totalCount: count, filteredOutCount } = await fetchMagentoOrdersData(connection, currentPage, pageSize);
          
          if (filteredOutCount) {
            outsideWindowOrders += filteredOutCount;
          }
          
          if (count && count > 0) {
            totalCount = count;
            if (progress) {
              progress.total_orders = count;
              progress.total_pages = Math.ceil(count / pageSize);
            }
          }

          if (!orders.length) {
            console.log(`📋 Page ${currentPage} returned 0 orders`);
            consecutiveEmptyPages++;
            
            if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
              console.log(`⚠️ Received ${maxConsecutiveEmptyPages} consecutive empty pages. Assuming end of data.`);
              break;
            }
            
            currentPage++;
            pagesProcessed++;
            continue;
          } else {
            consecutiveEmptyPages = 0;
          }

          console.log(`🧮 Processing ${orders.length} orders from page ${currentPage}`);
          
          const storeResult = await storeTransactions(orders, currentStoreId);
          
          const skippedInThisBatch = storeResult.stats.skipped || 0;
          totalSkippedOrders += skippedInThisBatch;
          
          const skipRate = skippedInThisBatch / orders.length;
          if (skipRate >= skipRateThreshold) {
            highSkipRatePages++;
            console.warn(`⚠️ High skip rate on page ${currentPage}: ${Math.round(skipRate * 100)}% of orders skipped (${skippedInThisBatch}/${orders.length})`);
          }
          
          console.log(`📊 Page ${currentPage} results: ${storeResult.stats.new} new, ${storeResult.stats.updated} updated, ${skippedInThisBatch} skipped`);
          
          allOrders.push(...orders);
          
          const successfullyProcessed = orders.length - skippedInThisBatch;
          totalFetched += successfullyProcessed;
          
          if (progress) {
            progress.orders_processed = totalFetched;
            progress.current_page = currentPage;
            progress.updated_at = new Date().toISOString();
            progress.skipped_orders = totalSkippedOrders;
            
            let warningMsg = '';
            
            if (highSkipRatePages > 0) {
              warningMsg += `${highSkipRatePages} page(s) had high skip rates. `;
            }
            
            if (outsideWindowOrders > 0) {
              warningMsg += `${outsideWindowOrders} orders were outside your subscription time window. `;
            }
            
            if (totalSkippedOrders > 0) {
              warningMsg += `Total ${totalSkippedOrders} orders skipped due to invalid data or subscription limits.`;
            }
            
            progress.warning_message = warningMsg;
            
            let progressSaved = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!progressSaved && retryCount < maxRetries) {
              try {
                const { error: updateError } = await supabase
                  .from("sync_progress")
                  .update(progress)
                  .eq("store_id", currentStoreId)
                  .eq("connection_id", connection.id)
                  .eq("status", "in_progress");
  
                if (updateError) {
                  console.error(`❌ Error updating sync progress (attempt ${retryCount + 1}):`, updateError.message);
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(`Retrying progress update in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                } else {
                  console.log(`✅ Updated sync progress: ${totalFetched}/${totalCount} orders processed, ${totalSkippedOrders} skipped`);
                  progressSaved = true;
                }
              } catch (updateError) {
                console.error(`❌ Error updating sync progress (attempt ${retryCount + 1}):`, updateError);
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`Retrying progress update in 1 second...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }
            
            if (!progressSaved) {
              console.error(`❌ Failed to update sync progress after ${maxRetries} attempts. Continuing sync anyway.`);
            }
          }

          currentPage++;
          pagesProcessed++;

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
          
          if (progress) {
            progress.error_message = `Error fetching page ${currentPage}: ${fetchError.message}`;
            progress.updated_at = new Date().toISOString();
            
            try {
              const { error: updateError } = await supabase
                .from("sync_progress")
                .update(progress)
                .eq("store_id", currentStoreId)
                .eq("connection_id", connection.id)
                .eq("status", "in_progress");
  
              if (updateError) {
                console.error("❌ Error updating sync progress with error:", updateError.message);
              }
            } catch (updateError) {
              console.error("❌ Error updating sync progress with error:", updateError);
            }
          }
          
          console.log(`⚠️ Continuing with ${allOrders.length} orders fetched before the error`);
          break;
        }
        
      } while ((totalFetched + totalSkippedOrders) < totalCount && !shouldContinue);

      console.log(`📦 Processing ${allOrders.length} orders for store: ${connection.store_name}`);
      
      if (allOrders.length > 0) {
        await processDailySalesData(allOrders, currentStoreId);
      }

      if (!shouldContinue && progress) {
        progress.status = "completed";
        progress.updated_at = new Date().toISOString();
        
        let completionSaved = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!completionSaved && retryCount < maxRetries) {
          try {
            const { error: updateError } = await supabase
              .from("sync_progress")
              .update(progress)
              .eq("store_id", currentStoreId)
              .eq("connection_id", connection.id);
    
            if (updateError) {
              console.error(`❌ Error updating sync progress to completed (attempt ${retryCount + 1}):`, updateError.message);
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`Retrying completion update in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } else {
              console.log(`✅ Marked sync progress as completed for ${connection.store_name}`);
              completionSaved = true;
            }
          } catch (updateError) {
            console.error(`❌ Error updating sync progress to completed (attempt ${retryCount + 1}):`, updateError);
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying completion update in 1 second...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!completionSaved) {
          console.error(`❌ Failed to mark sync as completed after ${maxRetries} attempts.`);
        }
      }

      let syncSummary = `✅ Finished processing ${allOrders.length} orders for ${connection.store_name}`;
      if (totalSkippedOrders > 0) {
        syncSummary += `. ${totalSkippedOrders} orders were skipped due to invalid data.`;
      }
      if (outsideWindowOrders > 0) {
        syncSummary += `. ${outsideWindowOrders} orders were outside the subscription time window.`;
      }
      
      console.log(syncSummary);
      
      if (shouldContinue) {
        break;
      }

    } catch (syncError) {
      console.error(`❌ Error processing orders for ${connection.store_name}:`, syncError);
      
      try {
        const { error: updateError } = await supabase
          .from("sync_progress")
          .update({
            status: "error",
            error_message: `Error processing orders: ${syncError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq("store_id", currentStoreId)
          .eq("connection_id", connection.id)
          .eq("status", "in_progress");
  
        if (updateError) {
          console.error("❌ Error updating sync progress with error:", updateError.message);
        }
      } catch (updateError) {
        console.error("❌ Error updating sync progress with error:", updateError);
      }
    }
  }

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
