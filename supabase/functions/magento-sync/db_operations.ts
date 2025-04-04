
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Database } from "../_shared/database_types.ts";

// Supabase client setup - used for database operations
const supabaseUrl = "https://vlkcnndgtarduplyedyp.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Store daily sales data (aggregated)
export async function processDailySalesData(salesData: any[], storeId: string) {
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
export async function storeTransactions(salesData: any[], storeId: string) {
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
        customer_group: order.customer_group,
        status: order.status
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
