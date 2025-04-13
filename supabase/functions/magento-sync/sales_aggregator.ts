
import { supabase } from "../_shared/db_client.ts";

// Aggregate sales data by date
export async function aggregateSalesData(storeId: string) {
  try {
    // Fetch all transactions for the store
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId);
      
    if (error) {
      console.error(`Error fetching transactions: ${error.message}`);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log(`No transactions found for store ${storeId}`);
      return;
    }
    
    await processDailySalesData(transactions, storeId);
    console.log(`Successfully aggregated sales data for store ${storeId}`);
    
    return true;
  } catch (error) {
    console.error(`Error aggregating sales data: ${error.message}`);
    throw error;
  }
}

// Store daily sales data (aggregated)
export async function processDailySalesData(salesData: any[], storeId: string) {
  try {
    // Group sales by date
    const salesByDate = salesData.reduce((acc, order) => {
      const createdAt = order.transaction_date;
      if (!createdAt || typeof createdAt !== 'string' || !createdAt.includes('T')) {
        console.warn(`⚠️ Skipping order with invalid transaction_date:`, order);
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

      acc[orderDate].total_sales += parseFloat(order.amount);
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
