
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";
import { synchronizeMagentoData, getSyncProgress } from "./sync_service.ts";
import { supabase } from "../_shared/db_client.ts";

// Implement retry logic for database operations
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Retry ${retries + 1}/${maxRetries} failed: ${error.message}`);
      retries++;
      
      // Wait before retrying
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw lastError;
}

// Helper function to test a Magento connection
async function testMagentoConnection(storeUrl: string, accessToken: string, connectionId?: string, storeName?: string, userId?: string) {
  try {
    console.log(`Testing connection to Magento at ${storeUrl}`);

    // Make a small request to the Magento API to verify credentials
    const apiUrl = `${storeUrl}/rest/V1/store/storeConfigs`;

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    console.log('Sending request to Magento API to test connection...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);

      if (response.status === 401) {
        return {
          success: false,
          error: "Ugyldig API-nøgle. Dette er typisk et admin REST API token fra Magento, ikke dit admin-password."
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: "Magento API endpoint ikke fundet. Kontroller at URL'en er korrekt og at Magento REST API er aktiveret."
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: "For mange forespørgsler til Magento API. Vent venligst lidt og prøv igen."
        };
      }

      throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully connected to Magento API');

    // Hvis vi har fået et connectionId med, opdatér denne forbindelse
    if (connectionId && userId) {
      console.log(`Activating connection ${connectionId} for user ${userId}`);
      
      // 1. Opret store-record hvis den ikke findes
      let storeId;
      
      if (storeName) {
        console.log(`Setting up store: ${storeName}`);
        
        // Using retry logic for database operations
        const existingStore = await withRetry(async () => {
          const { data, error } = await supabase
            .from('stores')
            .select('id')
            .eq('name', storeName)
            .maybeSingle();
            
          if (error) {
            console.error('Error checking for existing store:', error);
            throw error;
          }
          
          return data;
        });
        
        if (existingStore) {
          console.log(`Found existing store with ID: ${existingStore.id}`);
          storeId = existingStore.id;
        } else {
          const newStore = await withRetry(async () => {
            const { data, error } = await supabase
              .from('stores')
              .insert({ 
                name: storeName,
                url: storeUrl
              })
              .select()
              .single();
              
            if (error || !data) {
              console.error('Error creating store:', error);
              throw error || new Error('Failed to create store: No data returned');
            }
            
            return data;
          });
          
          console.log(`Created new store with ID: ${newStore.id}`);
          storeId = newStore.id;
        }
        
        // 2. Opdatér forbindelsen med store_id og status 'active'
        await withRetry(async () => {
          const { data, error } = await supabase
            .from('magento_connections')
            .update({
              store_id: storeId,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', connectionId)
            .select();
            
          if (error || !data || data.length === 0) {
            console.error('❌ Failed to activate connection:', error?.message || 'No rows updated');
            throw error || new Error('No rows updated');
          }
          
          return data;
        });
        
        console.log('✅ Successfully activated connection with store_id:', storeId);
        
        return {
          success: true,
          message: "Forbindelse til Magento API oprettet med succes",
          storeInfo: data,
          storeId: storeId
        };
      }
    }

    return {
      success: true,
      message: "Forbindelse til Magento API oprettet med succes",
      storeInfo: data
    };
  } catch (error) {
    console.error(`Error testing Magento connection: ${error.message}`);
    return {
      success: false,
      error: `Fejl ved forbindelse til Magento: ${error.message}`
    };
  }
}

// Process chunked sync using the continuation mechanism
async function processSyncWithContinuation(options: any) {
  try {
    const result = await synchronizeMagentoData(options);
    
    // If we need to continue syncing, trigger the next chunk via the cron function
    if (result.success && result.continuation) {
      console.log("⏭️ Sync needs to continue. Scheduling next chunk...");
      
      try {
        // Use the SUPABASE_ANON_KEY to call the same function for the next chunk
        const nextChunkOptions = {
          trigger: 'continuation',
          continuationData: result.continuation,
          syncType: options.syncType || 'full',
          useMock: options.useMock || false
        };
        
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const functionUrl = "https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync-cron";
        
        // Schedule the next chunk using the cron function
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            action: 'continue_sync',
            continuationData: result.continuation
          })
        });
        
        console.log("✅ Next chunk scheduled successfully");
      } catch (continuationError) {
        console.error("❌ Error scheduling next chunk:", continuationError);
      }
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error in processSyncWithContinuation:", error);
    return { success: false, error: error.message };
  }
}

// New function to get sync progress
async function handleGetSyncProgress(storeId: string) {
  return await getSyncProgress(storeId);
}

// Handle HTTP requests
serve(async (req) => {
  console.log(`Received request to magento-sync function: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Only allow POST requests for manual triggers
  if (req.method === 'POST') {
    try {
      let requestBody;
      try {
        requestBody = await req.json();
        console.log('Request body received:', JSON.stringify(requestBody));
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return createCorsResponse({
          success: false,
          error: "Invalid JSON in request body",
          message: "The request couldn't be processed because it contains invalid JSON. Please check your request format."
        }, 400);
      }

      // Handle connection testing
      if (requestBody.action === 'test_connection') {
        console.log('Processing test_connection action');
        const { storeUrl, accessToken, connectionId, storeName, userId } = requestBody;

        if (!storeUrl || !accessToken) {
          console.error('Missing required parameters for test_connection');
          return createCorsResponse({
            success: false,
            error: "Missing required parameters: storeUrl and accessToken",
            message: "Store URL og API nøgle er påkrævet for at teste forbindelsen."
          }, 400);
        }

        const testResult = await testMagentoConnection(storeUrl, accessToken, connectionId, storeName, userId);
        console.log('Test connection result:', testResult);
        return createCorsResponse(testResult, testResult.success ? 200 : 400);
      }
      
      // Handle getting sync progress
      if (requestBody.action === 'get_sync_progress') {
        console.log('Processing get_sync_progress action');
        const { storeId } = requestBody;

        if (!storeId) {
          console.error('Missing required parameter for get_sync_progress: storeId');
          return createCorsResponse({
            success: false,
            error: "Missing required parameter: storeId",
            message: "Store ID er påkrævet for at hente synkroniseringsstatus."
          }, 400);
        }

        try {
          const progressResult = await handleGetSyncProgress(storeId);
          return createCorsResponse(progressResult, progressResult.success ? 200 : 500);
        } catch (progressError) {
          console.error('Error getting sync progress:', progressError);
          return createCorsResponse({
            success: false,
            error: `Failed to get sync progress: ${progressError.message}`,
            message: "Der opstod en fejl under hentning af synkroniseringsstatus. Prøv igen senere."
          }, 500);
        }
      }
      
      // Handle sync continuation
      if (requestBody.action === 'continue_sync') {
        console.log('Processing continue_sync action');
        const { continuationData } = requestBody;

        if (!continuationData || !continuationData.connectionId || !continuationData.storeId) {
          console.error('Missing required parameters for continue_sync');
          return createCorsResponse({
            success: false,
            error: "Missing required continuation data",
            message: "Der mangler data for at fortsætte synkroniseringen."
          }, 400);
        }

        const syncOptions = {
          startPage: continuationData.startPage || 1,
          storeId: continuationData.storeId,
          connectionId: continuationData.connectionId,
          maxPages: 5, // Process fewer pages in continuation to reduce timeout risk
          changesOnly: continuationData.changesOnly || false
        };

        console.log('Continuing sync with options:', syncOptions);
        
        try {
          const result = await processSyncWithContinuation(syncOptions);
          return createCorsResponse(result, result.success ? 200 : 500);
        } catch (syncError) {
          console.error('Error continuing sync:', syncError);
          return createCorsResponse({
            success: false,
            error: `Failed to continue sync: ${syncError.message}`,
            message: "Der opstod en fejl under fortsættelse af synkroniseringen. Prøv igen senere."
          }, 500);
        }
      }

      // Handle regular sync requests
      const syncType = requestBody.syncType || 'full';
      const useMock = requestBody.useMock === true;
      const maxPages = requestBody.maxPages || 10; // Allow customizing page count
      const storeId = requestBody.store_id;

      console.log(`Received sync request with type: ${syncType}, useMock: ${useMock}, maxPages: ${maxPages}, storeId: ${storeId}`);

      if (!storeId) {
        console.error('Missing required parameter: store_id');
        return createCorsResponse({
          success: false,
          error: "Missing required parameter: store_id",
          message: "Store ID er påkrævet for at starte synkronisering."
        }, 400);
      }
      
      // Get the connection ID for this store
      try {
        const { data: connection, error: connectionError } = await supabase
          .from('magento_connections')
          .select('id')
          .eq('store_id', storeId)
          .maybeSingle();
          
        if (connectionError) {
          console.error('Error fetching connection for store:', connectionError.message);
          return createCorsResponse({
            success: false,
            error: `Error fetching connection: ${connectionError.message}`,
            message: "Kunne ikke finde forbindelse til Magento. Kontroller at du har oprettet en forbindelse."
          }, 400);
        }
        
        if (!connection) {
          console.error('No connection found for store:', storeId);
          return createCorsResponse({
            success: false,
            error: 'No connection found for store',
            message: "Ingen Magento-forbindelse fundet for denne butik. Opret en forbindelse først."
          }, 400);
        }
        
        const syncOptions = {
          changesOnly: syncType === 'changes_only',
          useMock: useMock,
          maxPages: maxPages,
          storeId: storeId,
          connectionId: connection.id
        };

        const result = await processSyncWithContinuation(syncOptions);
        
        console.log('Sync process initiated, returning result:', result);
        return createCorsResponse(result, result.success ? 200 : 500);
      } catch (syncError) {
        console.error('Error during sync process:', syncError);
        return createCorsResponse({
          success: false,
          error: `Sync process failed: ${syncError.message}`,
          message: "Der opstod en fejl under synkronisering. Se detaljerne i systemmeddelelser."
        }, 500);
      }
    } catch (error) {
      console.error('Error processing sync request:', error);
      return createCorsResponse({ 
        success: false, 
        error: error.message,
        message: "Der opstod en uventet fejl. Prøv igen senere eller kontakt support."
      }, 500);
    }
  }

  // Handle unauthorized or incorrect methods
  console.error(`Method not allowed: ${req.method}`);
  return createCorsResponse({ 
    error: 'Method not allowed',
    message: "Denne metode er ikke tilladt. Brug POST."
  }, 405);
});
