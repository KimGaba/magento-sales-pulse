
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors_utils.ts";

// Helper function to create responses with CORS headers
function createCorsResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // This is an internal function that will be called by the Supabase scheduled job
  // or by the sync function to continue a sync that was interrupted
  if (req.method === 'POST') {
    try {
      let requestBody;
      try {
        requestBody = await req.json();
        console.log('Cron request body received:', JSON.stringify(requestBody));
      } catch (parseError) {
        console.error('Error parsing cron request body:', parseError);
        return createCorsResponse({
          success: false,
          error: "Invalid JSON in request body"
        }, 400);
      }
      
      // Handle continuation of a sync that was split across multiple calls
      if (requestBody.action === 'continue_sync' && requestBody.continuationData) {
        console.log('Starting continuation of Magento sync...');
        
        // Call the main magento-sync function with continuation data
        const magentoSyncUrl = "https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        
        console.log('Triggering continuation from scheduled job');
        const response = await fetch(magentoSyncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            action: 'continue_sync',
            continuationData: requestBody.continuationData
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error from magento-sync continuation (${response.status}): ${errorText}`);
          throw new Error(`Continuation function returned status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Continuation of Magento sync completed:', result);
        
        return createCorsResponse({ 
          success: true, 
          message: 'Continuation completed', 
          result 
        });
      }
      
      // Handle regular scheduled job
      console.log('Starting scheduled Magento sync job...');
      
      // Call the main magento-sync function
      const magentoSyncUrl = "https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      
      console.log('Triggering magento-sync function from scheduled job');
      const response = await fetch(magentoSyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          source: 'scheduled_job',
          maxPages: 10 // Use a reasonable page limit for scheduled jobs
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from magento-sync (${response.status}): ${errorText}`);
        throw new Error(`Sync function returned status ${response.status}`);
      }
      
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
