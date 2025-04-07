
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";
import { synchronizeMagentoData } from "./sync_service.ts";

// Helper function to test a Magento connection
async function testMagentoConnection(storeUrl: string, accessToken: string) {
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
      }
      
      throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully connected to Magento API');
    
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests for manual triggers
  if (req.method === 'POST') {
    try {
      const requestBody = await req.json();
      
      // Handle connection testing
      if (requestBody.action === 'test_connection') {
        const { storeUrl, accessToken } = requestBody;
        
        if (!storeUrl || !accessToken) {
          return createCorsResponse({
            success: false,
            error: "Missing required parameters: storeUrl and accessToken"
          }, 400);
        }
        
        const testResult = await testMagentoConnection(storeUrl, accessToken);
        return createCorsResponse(testResult, testResult.success ? 200 : 400);
      }
      
      // Handle sync requests
      const syncType = requestBody.syncType || 'full';
      const useMock = requestBody.useMock === true;
      
      console.log(`Received sync request with type: ${syncType}, useMock: ${useMock}`);
      
      const result = await synchronizeMagentoData({ 
        changesOnly: syncType === 'changes_only',
        useMock: useMock
      });
      
      return createCorsResponse(result, result.success ? 200 : 500);
    } catch (error) {
      console.error('Error processing sync request:', error);
      return createCorsResponse({ success: false, error: error.message }, 500);
    }
  }
  
  // Handle unauthorized or incorrect methods
  return createCorsResponse({ error: 'Method not allowed' }, 405);
});
