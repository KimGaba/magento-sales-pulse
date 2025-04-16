// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { synchronizeMagentoData, deleteConnection } from "./sync/index.ts";
import { getSyncProgress } from "./utils/supabaseClient.ts";
import { testConnection } from "./utils/magentoClient.ts";
import logger from "./utils/logger.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create CORS response helper
function createCorsResponse(body: any, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

// Retry helper
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let retries = 0;
  let lastError;
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      retries++;
      logger.warn(`Retry ${retries}/${maxRetries} failed: ${error.message}`);
      if (retries < maxRetries) {
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
}

// Entry point
serve(async (req) => {
  // Handle CORS preflight requests properly
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return createCorsResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();

    // Delete connection
    if (body.action === "delete_connection") {
      const { connectionId } = body;
      if (!connectionId) {
        return createCorsResponse({ success: false, error: "Missing connectionId" }, 400);
      }
      
      const result = await deleteConnection(connectionId);
      return createCorsResponse(result, result.success ? 200 : 400);
    }

    // Test connection
    if (body.action === "test_connection") {
      const { storeUrl, accessToken, connectionId, storeName, userId } = body;
      if (!storeUrl || !accessToken) {
        return createCorsResponse({ success: false, error: "Missing storeUrl or accessToken" }, 400);
      }
      
      // Test connection only
      if (!connectionId && !storeName && !userId) {
        const result = await testConnection(storeUrl, accessToken);
        return createCorsResponse(result, result.success ? 200 : 400);
      }

      // Test and create store if needed
      const testResult = await testConnection(storeUrl, accessToken);
      if (!testResult.success) {
        return createCorsResponse(testResult, 400);
      }

      // Create or update store and update connection
      try {
        const existingStore = await withRetry(async () => {
          const { data, error } = await supabase
            .from("stores")
            .select("id")
            .eq("name", storeName)
            .maybeSingle();
          if (error) throw error;
          return data;
        });

        const storeId = existingStore?.id || (await withRetry(async () => {
          const { data, error } = await supabase
            .from("stores")
            .insert({ name: storeName, url: storeUrl })
            .select()
            .single();
          if (error || !data) throw error || new Error("Store creation failed");
          return data.id;
        }));

        await withRetry(async () => {
          const { error } = await supabase
            .from("magento_connections")
            .update({ store_id: storeId, status: "active", updated_at: new Date().toISOString() })
            .eq("id", connectionId);
          if (error) throw error;
        });

        return createCorsResponse({ success: true, message: "Forbindelse oprettet", storeId });
      } catch (error) {
        return createCorsResponse({ success: false, error: `Store creation failed: ${error.message}` }, 400);
      }
    }

    // Get sync progress
    if (body.action === "get_sync_progress") {
      if (!body.storeId) {
        return createCorsResponse({ success: false, error: "Missing storeId" }, 400);
      }
      const result = await getSyncProgress(body.storeId);
      return createCorsResponse(result, result.success ? 200 : 500);
    }

    // Continue sync - for cron jobs or chunked processing
    if (body.action === "continue_sync") {
      const { continuationData } = body;
      if (!continuationData?.storeId || !continuationData?.connectionId) {
        return createCorsResponse({ success: false, error: "Missing continuation data" }, 400);
      }
      
      const options = {
        storeId: continuationData.storeId,
        connectionId: continuationData.connectionId,
        dataType: continuationData.dataType || "all",
        maxPages: continuationData.maxPages || 5,
        syncType: continuationData.changesOnly ? "changes_only" : "full",
        startPage: continuationData.startPage || 1
      };
      
      const result = await synchronizeMagentoData(options);
      return createCorsResponse(result, result.success ? 200 : 500);
    }

    // Default: Initial sync
    const { 
      syncType = "full", 
      dataType = "all",
      useMock = false, 
      maxPages = 10, 
      store_id: storeId 
    } = body;

    if (!storeId) {
      return createCorsResponse({ success: false, error: "Missing store_id" }, 400);
    }

    // Get the connection ID for this store
    const { data: connection, error } = await supabase
      .from("magento_connections")
      .select("id")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error || !connection) {
      return createCorsResponse({ success: false, error: "No Magento connection found" }, 400);
    }

    const syncOptions = {
      storeId,
      connectionId: connection.id,
      syncType,
      dataType,
      useMock,
      maxPages
    };

    const result = await synchronizeMagentoData(syncOptions);
    return createCorsResponse(result, result.success ? 200 : 500);
  } catch (error) {
    logger.error("Unexpected error", error as Error);
    return createCorsResponse({ success: false, error: error.message }, 500);
  }
});
