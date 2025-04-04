
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";
import { synchronizeMagentoData } from "./sync_service.ts";

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
      const syncType = requestBody.syncType || 'full';
      
      console.log(`Received sync request with type: ${syncType}`);
      
      const result = await synchronizeMagentoData({ 
        changesOnly: syncType === 'changes_only' 
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
