import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { fetchMagentoOrdersData, storeTransactions, processDailySalesData } from './magento_api.ts';

const supabaseUrl = "https://vlkcnndgtarduplyedyp.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main sync function
export async function synchronizeMagentoData({ useMock = false } = {}) {
  try {
    console.log("\n🔄 Starting Magento data synchronization");
    const { data: connections, error } = await supabase.from("magento_connections").select("*").eq("status", "active");
    if (error) throw new Error(`Failed to fetch connections: ${error.message}`);
    if (!connections || connections.length === 0) return {
      success: true,
      message: "No connections found"
    };

    for (const connection of connections) {
      const storeId = connection.store_id;
      if (!storeId) {
        console.warn(`⚠️ Missing store_id for connection ${connection.id}`);
        continue;
      }
      let page = 1, pageSize = 100, fetched = 0;
      do {
        const { orders, totalCount } = await fetchMagentoOrdersData(connection, page, pageSize);
        if (!orders || orders.length === 0) break;
        await storeTransactions(orders, storeId);
        await processDailySalesData(orders, storeId);
        fetched += orders.length;
        page++;
      } while (fetched % pageSize === 0);

      console.log(`✅ Finished sync for ${connection.store_name}`);
    }

    return {
      success: true,
      message: `✅ Successfully synchronized data for ${connections.length} store(s)`
    };
  } catch (err) {
    console.error("❌ Sync error:", err);
    return {
      success: false,
      message: `Sync failed: ${err.message}`
    };
  }
}

// Optionally, export a handler if used as an edge function
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    });
  }
  const { useMock = false } = await req.json();
  const result = await synchronizeMagentoData({
    useMock
  });
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    status: result.success ? 200 : 500
  });
});
