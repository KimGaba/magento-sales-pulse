
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { synchronizeMagentoData, getSyncProgress } from "./sync_service.ts";
import { supabase } from "../_shared/db_client.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";

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
      console.warn(`🔁 Retry ${retries}/${maxRetries} failed: ${error.message}`);
      if (retries < maxRetries) {
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
}

// Magento connection test
async function testMagentoConnection(storeUrl: string, accessToken: string, connectionId?: string, storeName?: string, userId?: string) {
  try {
    const apiUrl = `${storeUrl}/rest/V1/store/storeConfigs`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) return { success: false, error: "Ugyldig API-nøgle." };
      if (response.status === 404) return { success: false, error: "Magento API endpoint ikke fundet." };
      if (response.status === 429) return { success: false, error: "For mange forespørgsler." };
      throw new Error(errorText);
    }

    const data = await response.json();

    if (connectionId && userId && storeName) {
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

      return { success: true, message: "Forbindelse oprettet", storeId };
    }

    return { success: true, message: "Forbindelse verificeret", storeInfo: data };
  } catch (error) {
    return { success: false, error: `Magento-forbindelse fejlede: ${error.message}` };
  }
}

// Handle store/connection deletion
async function deleteConnection(connectionId: string) {
  try {
    console.log(`Starting deletion process for connection: ${connectionId}`);
    
    // First check if the connection exists
    const { data: connection, error: connectionError } = await supabase
      .from('magento_connections')
      .select('id, store_id, store_name')
      .eq('id', connectionId)
      .maybeSingle();
      
    if (connectionError || !connection) {
      console.log(`Connection not found or error: ${connectionError?.message || 'Not found'}`);
      return { 
        success: false, 
        error: `Forbindelse ikke fundet: ${connectionError?.message || 'Ikke fundet'}` 
      };
    }
    
    console.log(`Found connection: ${connection.id}, store_id: ${connection.store_id || 'None'}`);
    
    // If we have a store_id, delete all related data using the delete_store_data function
    if (connection.store_id) {
      console.log(`Using delete_store_data function for store_id: ${connection.store_id}`);
      const { error } = await supabase.rpc('delete_store_data', {
        target_store_id: connection.store_id
      });
      
      if (error) {
        console.error(`Error deleting store data: ${error.message}`);
        throw error;
      }
      
      console.log(`Successfully deleted store data for store_id: ${connection.store_id}`);
      return { success: true, message: `Butik "${connection.store_name}" blev slettet` };
    } 
    else {
      // If no store_id, just delete the connection directly
      console.log(`No store_id found, deleting connection directly: ${connection.id}`);
      
      // First delete any related data - sync_progress
      const { error: syncError } = await supabase
        .from('sync_progress')
        .delete()
        .eq('connection_id', connection.id);
        
      if (syncError) {
        console.error(`Error deleting sync progress: ${syncError.message}`);
        // Continue anyway, non-critical
      }
      
      // Delete any store views
      const { error: viewsError } = await supabase
        .from('magento_store_views')
        .delete()
        .eq('connection_id', connection.id);
        
      if (viewsError) {
        console.error(`Error deleting store views: ${viewsError.message}`);
        // Continue anyway, non-critical
      }
      
      // Finally delete the connection
      const { error: deleteError } = await supabase
        .from('magento_connections')
        .delete()
        .eq('id', connection.id);
        
      if (deleteError) {
        console.error(`Error deleting connection: ${deleteError.message}`);
        throw deleteError;
      }
      
      console.log(`Successfully deleted connection: ${connection.id}`);
      return { 
        success: true, 
        message: `Forbindelsen "${connection.store_name}" blev slettet`
      };
    }
  } catch (error) {
    console.error(`Error in deleteConnection: ${error.message}`);
    return { 
      success: false, 
      error: `Kunne ikke slette forbindelsen: ${error.message}` 
    };
  }
}

// Chunked sync
async function processSyncWithContinuation(options: any) {
  try {
    const result = await synchronizeMagentoData(options);

    if (result.success && result.continuation) {
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      const functionUrl = "https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync-cron";

      await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: "continue_sync",
          continuationData: result.continuation,
        }),
      });
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Sync progress
async function handleGetSyncProgress(storeId: string) {
  return await getSyncProgress(storeId);
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
      const result = await testMagentoConnection(storeUrl, accessToken, connectionId, storeName, userId);
      return createCorsResponse(result, result.success ? 200 : 400);
    }

    // Get sync progress
    if (body.action === "get_sync_progress") {
      if (!body.storeId) {
        return createCorsResponse({ success: false, error: "Missing storeId" }, 400);
      }
      const result = await handleGetSyncProgress(body.storeId);
      return createCorsResponse(result, result.success ? 200 : 500);
    }

    // Continue sync
    if (body.action === "continue_sync") {
      const { continuationData } = body;
      if (!continuationData?.storeId || !continuationData?.connectionId) {
        return createCorsResponse({ success: false, error: "Missing continuation data" }, 400);
      }
      const options = {
        startPage: continuationData.startPage || 1,
        storeId: continuationData.storeId,
        connectionId: continuationData.connectionId,
        maxPages: 5,
        changesOnly: continuationData.changesOnly || false,
      };
      const result = await processSyncWithContinuation(options);
      return createCorsResponse(result, result.success ? 200 : 500);
    }

    // Initial sync
    const { syncType = "full", useMock = false, maxPages = 10, store_id: storeId } = body;

    if (!storeId) {
      return createCorsResponse({ success: false, error: "Missing store_id" }, 400);
    }

    const { data: connection, error } = await supabase
      .from("magento_connections")
      .select("id")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error || !connection) {
      return createCorsResponse({ success: false, error: "No Magento connection found" }, 400);
    }

    const syncOptions = {
      changesOnly: syncType === "changes_only",
      useMock,
      maxPages,
      storeId,
      connectionId: connection.id,
    };

    const result = await processSyncWithContinuation(syncOptions);
    return createCorsResponse(result, result.success ? 200 : 500);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return createCorsResponse({ success: false, error: error.message }, 500);
  }
});
