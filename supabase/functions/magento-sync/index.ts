
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";
import { synchronizeMagentoData } from "./sync_service.ts";
import { supabase } from "../_shared/db_client.ts";

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
        const { data: existingStore, error: storeCheckError } = await supabase
          .from('stores')
          .select('id')
          .eq('name', storeName)
          .maybeSingle();
          
        if (storeCheckError) {
          console.error('Error checking for existing store:', storeCheckError);
        }
        
        if (existingStore) {
          console.log(`Found existing store with ID: ${existingStore.id}`);
          storeId = existingStore.id;
        } else {
          const { data: newStore, error: storeCreateError } = await supabase
            .from('stores')
            .insert({ 
              name: storeName,
              url: storeUrl
            })
            .select()
            .single();
            
          if (storeCreateError || !newStore) {
            console.error('Error creating store:', storeCreateError);
            throw new Error(`Failed to create store: ${storeCreateError?.message || 'Unknown error'}`);
          }
          
          console.log(`Created new store with ID: ${newStore.id}`);
          storeId = newStore.id;
        }
        
        // 2. Opdatér forbindelsen med store_id og status 'active'
        const { data: updatedConnection, error: updateError } = await supabase
          .from('magento_connections')
          .update({
            store_id: storeId,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId)
          .select();
          
        if (updateError || !updatedConnection || updatedConnection.length === 0) {
          console.error('❌ Failed to activate connection:', updateError?.message || 'No rows updated');
          throw new Error(`Failed to activate connection: ${updateError?.message || 'No rows updated'}`);
        }
        
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
          error: "Invalid JSON in request body"
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
            error: "Missing required parameters: storeUrl and accessToken"
          }, 400);
        }

        const testResult = await testMagentoConnection(storeUrl, accessToken, connectionId, storeName, userId);
        console.log('Test connection result:', testResult);
        return createCorsResponse(testResult, testResult.success ? 200 : 400);
      }

      // Handle sync requests
      const syncType = requestBody.syncType || 'full';
      const useMock = requestBody.useMock === true;

      console.log(`Received sync request with type: ${syncType}, useMock: ${useMock}`);

      try {
        const result = await synchronizeMagentoData({
          changesOnly: syncType === 'changes_only',
          useMock: useMock
        });

        console.log('Sync process complete, returning result:', result);
        return createCorsResponse(result, result.success ? 200 : 500);
      } catch (syncError) {
        console.error('Error during sync process:', syncError);
        return createCorsResponse({
          success: false,
          error: `Sync process failed: ${syncError.message}`
        }, 500);
      }
    } catch (error) {
      console.error('Error processing sync request:', error);
      return createCorsResponse({ success: false, error: error.message }, 500);
    }
  }

  // Handle unauthorized or incorrect methods
  console.error(`Method not allowed: ${req.method}`);
  return createCorsResponse({ error: 'Method not allowed' }, 405);
});
