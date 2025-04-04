
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors_utils.ts";

// Handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // This is an internal function that will be called by the Supabase scheduled job
  if (req.method === 'POST') {
    try {
      // Call the main magento-sync function
      const magentoSyncUrl = "https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      
      const response = await fetch(magentoSyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ source: 'scheduled_job' })
      });
      
      const result = await response.json();
      console.log('Scheduled Magento sync job completed:', result);
      
      return createCorsResponse({ success: true, message: 'Scheduled sync completed', result });
    } catch (error) {
      console.error('Error running scheduled Magento sync:', error);
      return createCorsResponse({ success: false, error: error.message }, 500);
    }
  }
  
  // Handle unauthorized or incorrect methods
  return createCorsResponse({ error: 'Method not allowed' }, 405);
});
