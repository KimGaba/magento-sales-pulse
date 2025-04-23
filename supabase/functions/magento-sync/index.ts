// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { synchronizeMagentoData, deleteConnection } from "./sync/index.ts";
import { getSyncProgress } from "./utils/supabaseClient.ts";
import { testConnection } from "./utils/magentoClient.ts";
import logger from "./utils/logger.ts";
import { supabase } from "./utils/supabaseClient.ts";

const log = logger.createLogger("index");

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Create CORS response helper
function createCorsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

// Retry helper
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let retries = 0;
  let lastError;
  while(retries < maxRetries){
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      retries++;
      logger.warn(`Retry ${retries}/${maxRetries} failed: ${error.message}`);
      if (retries < maxRetries) {
        await new Promise((res)=>setTimeout(res, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
}

// Entry point
serve(async (req)=>{
  // Handle CORS preflight requests properly
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  if (req.method !== "POST") {
    return createCorsResponse({
      error: "Method not allowed"
    }, 405);
  }
  
  try {
    const body = await req.json();
    
    // Delete connection
    if (body.action === "delete_connection") {
      const { connectionId } = body;
      if (!connectionId) {
        return createCorsResponse({
          success: false,
          error: "Missing connectionId"
        }, 400);
      }
      
      const result = await deleteConnection(connectionId);
      return createCorsResponse(result, result.success ? 200 : 400);
    }
    
    // Test connection
    if (body.action === "test_connection") {
      const { storeUrl, accessToken, connectionId, storeName, userId } = body;
      if (!storeUrl || !accessToken) {
        return createCorsResponse({
          success: false,
          error: "Missing storeUrl or accessToken"
        }, 400);
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
        const existingStore = await withRetry(async ()=>{
          const { data, error } = await supabase.from("stores").select("id").eq("name", storeName).maybeSingle();
          if (error) throw error;
          return data;
        });
        
        const storeId = existingStore?.id || await withRetry(async ()=>{
          const { data, error } = await supabase.from("stores").insert({
            name: storeName,
            url: storeUrl
          }).select().single();
          if (error || !data) throw error || new Error("Store creation failed");
          return data.id;
        });
        
        // FIXED: Keep status as 'pending' until synchronization is complete
        await withRetry(async ()=>{
          const { error } = await supabase.from("magento_connections").update({
            store_id: storeId,
            status: "pending", // Changed from 'active' to 'pending'
            updated_at: new Date().toISOString()
          }).eq("id", connectionId);
          if (error) throw error;
        });
        
        // ADDED: Trigger synchronization process immediately after connection creation
        try {
          log.info(`Triggering initial synchronization for store ${storeId}`);
          
          // Start the synchronization process
          const syncOptions = {
            storeId,
            connectionId,
            syncType: 'full',
            dataType: 'all',
            maxPages: 1000
          };
          
          // Use a non-blocking approach to start synchronization
          synchronizeMagentoData(syncOptions).then((result)=>{
            if (result.success) {
              // Update connection status to 'active' after successful sync
              supabase.from("magento_connections").update({
                status: 'active',
                updated_at: new Date().toISOString()
              }).eq("id", connectionId).then(()=>{
                log.info(`Connection ${connectionId} updated to active status after successful sync`);
              }).catch((error)=>{
                log.error(`Failed to update connection status: ${error.message}`);
              });
            } else {
              log.error(`Synchronization failed: ${result.error}`);
            }
          }).catch((error)=>{
            log.error(`Error in synchronization process: ${error.message}`);
          });
          
          log.info(`Synchronization process started for store ${storeId}`);
        } catch (syncError) {
          log.error(`Failed to trigger synchronization: ${syncError.message}`);
          // Don't fail the connection creation if sync trigger fails
        }
        
        return createCorsResponse({
          success: true,
          message: "Forbindelse oprettet",
          storeId,
          status: 'pending' // Inform frontend that connection is pending
        });
      } catch (error) {
        return createCorsResponse({
          success: false,
          error: `Store creation failed: ${error.message}`
        }, 400);
      }
    }
    
    // Get sync progress
    if (body.action === "get_sync_progress") {
      if (!body.storeId) {
        return createCorsResponse({
          success: false,
          error: "Missing storeId"
        }, 400);
      }
      const result = await getSyncProgress(body.storeId);
      return createCorsResponse(result, result.success ? 200 : 500);
    }
    
    // Continue sync - for cron jobs or chunked processing
    if (body.action === "continue_sync") {
      const { continuationData } = body;
      if (!continuationData?.storeId || !continuationData?.connectionId) {
        return createCorsResponse({
          success: false,
          error: "Missing continuation data"
        }, 400);
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
    const { syncType = "full", dataType = "all", useMock = false, maxPages = 10, store_id: storeId } = body;
    if (!storeId) {
      return createCorsResponse({
        success: false,
        error: "Missing store_id"
      }, 400);
    }
    
    // Get the connection ID for this store
    const { data: connection, error } = await supabase.from("magento_connections").select("id").eq("store_id", storeId).maybeSingle();
    if (error || !connection) {
      return createCorsResponse({
        success: false,
        error: "No Magento connection found"
      }, 400);
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
    
    // ADDED: Update connection status to 'active' after successful sync
    if (result.success) {
      try {
        await supabase
          .from("magento_connections")
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString() 
          })
          .eq("id", connection.id);
        
        log.info(`Connection ${connection.id} updated to active status after successful sync`);
      } catch (updateError) {
        log.error(`Failed to update connection status: ${updateError.message}`);
      }
    }
    
    return createCorsResponse(result, result.success ? 200 : 500);
  } catch (error) {
    logger.error("Unexpected error", error);
    return createCorsResponse({
      success: false,
      error: error.message
    }, 500);
  }
});
