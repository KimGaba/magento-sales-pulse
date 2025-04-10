
import { supabase } from "../_shared/db_client.ts";
import { fetchMagentoOrdersData, mockMagentoOrdersData } from "./magento_api.ts";
import { storeTransactions } from "./store_transactions.ts";
import { processDailySalesData } from "./sales_aggregator.ts";

interface SyncOptions {
  changesOnly?: boolean;
  useMock?: boolean;
}

export async function synchronizeMagentoData(options: SyncOptions = {}) {
  const { useMock = false } = options;

  console.log("\n🔄 Starting Magento data synchronization", options);

  const { data: connections, error } = await supabase
    .from("magento_connections")
    .select("*")
    .eq("status", "active");

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

  for (const connection of connections) {
    const storeId = connection.store_id;
    if (!storeId) {
      console.warn(`⚠️ Skipping connection ${connection.id} - missing store_id`);
      continue;
    }

    console.log(`\n🔧 Processing connection for store: ${connection.store_name} (ID: ${storeId})`);

    try {
      let allOrders = [];

      if (useMock) {
        allOrders = await mockMagentoOrdersData();
      } else {
        let page = 1;
        const pageSize = 100;
        let totalFetched = 0;
        let totalCount = 0;

        do {
          const { orders, totalCount: count } = await fetchMagentoOrdersData(connection, page, pageSize);
          if (!orders.length) break;

          allOrders.push(...orders);
          totalFetched += orders.length;
          totalCount = count;

          page++;
        } while (totalFetched < totalCount);
      }

      console.log(`📦 Total orders to store: ${allOrders.length}`);
      await storeTransactions(allOrders, storeId);
      await processDailySalesData(allOrders, storeId);

      console.log(`✅ Finished processing ${allOrders.length} orders for ${connection.store_name}`);

    } catch (syncError) {
      console.error(`❌ Error processing orders for ${connection.store_name}:`, syncError);
    }
  }

  return {
    success: true,
    message: "✅ Magento sync completed"
  };
}
