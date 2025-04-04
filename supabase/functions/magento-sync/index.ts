
// Follow Deno and Supabase Edge runtime conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Database } from "../_shared/database_types.ts";

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client setup - used for database operations
const supabaseUrl = "https://vlkcnndgtarduplyedyp.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Function to synchronize data from Magento
async function synchronizeMagentoData() {
  console.log("Starting Magento data synchronization");
  
  try {
    // 1. Get all active Magento connections
    const { data: connections, error: connectionsError } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('status', 'active');
    
    if (connectionsError) {
      throw new Error(`Error fetching Magento connections: ${connectionsError.message}`);
    }
    
    if (!connections || connections.length === 0) {
      console.log("No active Magento connections found. Exiting.");
      return { success: true, message: "No active connections to process" };
    }
    
    console.log(`Found ${connections.length} active Magento connections`);
    
    // Process each connection
    for (const connection of connections) {
      console.log(`Processing connection for store: ${connection.store_name}`);
      
      // 2. Initialize the store in our database if it doesn't exist yet
      let storeId = connection.store_id;
      
      if (!storeId) {
        // Create a new store record
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .insert({
            name: connection.store_name,
            url: connection.store_url
          })
          .select()
          .single();
        
        if (storeError) {
          console.error(`Error creating store for ${connection.store_name}: ${storeError.message}`);
          continue;
        }
        
        storeId = storeData.id;
        
        // Update the connection with the new store_id
        await supabase
          .from('magento_connections')
          .update({ store_id: storeId })
          .eq('id', connection.id);
          
        console.log(`Created new store with ID: ${storeId}`);
      }
      
      // 3. Fetch sales data from Magento
      const salesData = await fetchMagentoSalesData(connection);
      
      if (!salesData || !salesData.length) {
        console.log(`No sales data fetched for store ${connection.store_name}`);
        continue;
      }
      
      console.log(`Fetched ${salesData.length} sales records for ${connection.store_name}`);
      
      // 4. Process and store the daily sales aggregated data
      await processDailySalesData(salesData, storeId);
      
      // 5. Store individual transactions
      await storeTransactions(salesData, storeId);
      
      // 6. Update connection status and last sync time
      await supabase
        .from('magento_connections')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
      
      console.log(`Completed synchronization for ${connection.store_name}`);
    }
    
    return { 
      success: true, 
      message: `Successfully synchronized data for ${connections.length} Magento stores` 
    };
    
  } catch (error) {
    console.error("Error during Magento synchronization:", error);
    return { 
      success: false, 
      message: `Synchronization failed: ${error.message}` 
    };
  }
}

// Function to fetch sales data from Magento API
async function fetchMagentoSalesData(connection: any) {
  try {
    console.log(`Connecting to Magento API at ${connection.store_url}`);
    
    // In a real implementation, you would make actual API calls to Magento
    // For demonstration purposes, we'll simulate a response with sample data
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate some sample data that includes store view and customer group
    const sampleOrders = [];
    const storeViews = ['dk', 'se', 'no', 'fi'];
    const customerGroups = ['retail', 'wholesale', 'vip'];
    const orderCount = Math.floor(Math.random() * 10) + 5; // 5-15 orders
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (let i = 0; i < orderCount; i++) {
      const orderDate = i % 2 === 0 ? today : yesterday;
      const storeView = storeViews[Math.floor(Math.random() * storeViews.length)];
      const customerGroup = customerGroups[Math.floor(Math.random() * customerGroups.length)];
      const amount = Math.floor(Math.random() * 10000) / 100; // Random amount between 0-100
      
      sampleOrders.push({
        increment_id: `10000${Math.floor(Math.random() * 1000)}`,
        created_at: orderDate.toISOString(),
        customer_email: `customer${i}@example.com`,
        customer_name: `Customer ${i}`,
        grand_total: amount,
        store_view: storeView,
        customer_group: customerGroup,
        status: 'complete'
      });
    }
    
    console.log(`Generated ${sampleOrders.length} sample orders`);
    return sampleOrders;
    
  } catch (error) {
    console.error(`Error fetching data from Magento API: ${error.message}`);
    throw error;
  }
}

// Process and store daily sales data (aggregated)
async function processDailySalesData(salesData: any[], storeId: string) {
  try {
    // Group sales by date
    const salesByDate = salesData.reduce((acc, order) => {
      // Extract just the date part (YYYY-MM-DD)
      const orderDate = order.created_at.split('T')[0];
      
      if (!acc[orderDate]) {
        acc[orderDate] = {
          total_sales: 0,
          order_count: 0,
          orders: []
        };
      }
      
      acc[orderDate].total_sales += parseFloat(order.grand_total);
      acc[orderDate].order_count += 1;
      acc[orderDate].orders.push(order);
      
      return acc;
    }, {});
    
    // Store daily sales for each date
    for (const [date, data] of Object.entries(salesByDate)) {
      const avgOrderValue = data.total_sales / data.order_count;
      
      // Check if a record already exists for this date and store
      const { data: existingRecord, error: checkError } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('store_id', storeId)
        .eq('date', date)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking for existing daily sales record: ${checkError.message}`);
        continue;
      }
      
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('daily_sales')
          .update({
            total_sales: data.total_sales,
            order_count: data.order_count,
            average_order_value: avgOrderValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
          
        if (updateError) {
          console.error(`Error updating daily sales record: ${updateError.message}`);
        } else {
          console.log(`Updated daily sales for ${date}`);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('daily_sales')
          .insert({
            store_id: storeId,
            date: date,
            total_sales: data.total_sales,
            order_count: data.order_count,
            average_order_value: avgOrderValue
          });
          
        if (insertError) {
          console.error(`Error inserting daily sales record: ${insertError.message}`);
        } else {
          console.log(`Inserted daily sales for ${date}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error processing daily sales data: ${error.message}`);
    throw error;
  }
}

// Store individual transactions
async function storeTransactions(salesData: any[], storeId: string) {
  try {
    // For each order, create a transaction record
    for (const order of salesData) {
      // Check if this transaction already exists (using external_id)
      const { data: existingTransaction, error: checkError } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .eq('external_id', order.increment_id)
        .maybeSingle();
        
      if (checkError) {
        console.error(`Error checking for existing transaction: ${checkError.message}`);
        continue;
      }
      
      // Skip if transaction already exists
      if (existingTransaction) {
        console.log(`Transaction for order ${order.increment_id} already exists, skipping`);
        continue;
      }
      
      // Add metadata including store_view and customer_group
      const metadata = {
        store_view: order.store_view,
        customer_group: order.customer_group
      };
      
      // Insert the transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          store_id: storeId,
          external_id: order.increment_id,
          amount: order.grand_total,
          transaction_date: order.created_at,
          customer_id: order.customer_email, // Using email as customer_id
          // We would add product_id if processing line items
        });
        
      if (insertError) {
        console.error(`Error inserting transaction for order ${order.increment_id}: ${insertError.message}`);
      } else {
        console.log(`Inserted transaction for order ${order.increment_id}`);
      }
    }
    
  } catch (error) {
    console.error(`Error storing transactions: ${error.message}`);
    throw error;
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
      const result = await synchronizeMagentoData();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  // Handle unauthorized or incorrect methods
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 405
  });
});
