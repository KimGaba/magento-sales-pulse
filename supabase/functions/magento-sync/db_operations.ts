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
      const createdAt = order.created_at;
      if (!createdAt || typeof createdAt !== 'string' || !createdAt.includes('T')) {
        console.warn(`⚠️ Skipping order with invalid created_at:`, order);
        return acc;
      }
      const orderDate = createdAt.split('T')[0];

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

// Store individual transactions from Magento orders
export async function storeTransactions(ordersData: any[], storeId: string) {
  try {
    for (const order of ordersData) {
      const { data: existingTransaction, error: checkError } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .eq('external_id', order.external_id)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking for existing transaction: ${checkError.message}`);
        continue;
      }

      if (existingTransaction) {
        console.log(`Transaction for order ${order.external_id} already exists, skipping`);
        continue;
      }

      // Slå store view info op i Supabase
let storeViewMeta = null;
if (order.store_view) {
  const { data: storeView } = await supabase
    .from('magento_store_views')
    .select('*')
    .eq('store_view_name', order.store_view)
    .maybeSingle();

  if (storeView) {
    storeViewMeta = {
      store_view_id: storeView.store_id, // ID fra Magento
      website_id: storeView.website_id,
      store_id: storeView.connection_id, // alternativt: storeView.store_id
    };
  }
}

// Kombiner metadata
const metadata = {
  store_view: order.store_view,
  customer_group: order.customer_group,
  status: order.status,
  items_count: order.items,
  payment_method: order.order_data?.payment_method,
  shipping_method: order.order_data?.shipping_method,
  customer_name: order.customer_name,
  ...storeViewMeta // dynamisk tilføj store_view_id etc. hvis fundet
};


      let transactionDate = order.transaction_date;
      if (transactionDate) {
        try {
          transactionDate = new Date(transactionDate).toISOString();
        } catch (e) {
          console.warn(`Invalid date format for order ${order.external_id}, using current time`);
          transactionDate = new Date().toISOString();
        }
      } else {
        transactionDate = new Date().toISOString();
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          store_id: storeId,
          external_id: order.external_id,
          amount: order.amount,
          transaction_date: transactionDate,
          customer_id: order.customer_id,
          metadata: metadata
        });

      if (insertError) {
        console.error(`Error inserting transaction for order ${order.external_id}: ${insertError.message}`);
      } else {
        console.log(`Inserted transaction for order ${order.external_id}`);
      }
    }

    console.log(`Completed storing ${ordersData.length} transactions`);
    return { success: true, count: ordersData.length };
  } catch (error) {
    console.error(`Error storing transactions: ${error.message}`);
    throw error;
  }
}
