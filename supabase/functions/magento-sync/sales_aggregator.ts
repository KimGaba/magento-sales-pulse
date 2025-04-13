
import { supabase } from "../_shared/db_client.ts";

// Aggregate sales data by date
export async function aggregateSalesData(storeId: string) {
  try {
    console.log(`Aggregating sales data for store ${storeId}`);
    
    // Fetch all transactions for the store
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId);
      
    if (error) {
      console.error(`Error fetching transactions: ${error.message}`);
      throw error;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log(`No transactions found for store ${storeId}`);
      return false;
    }
    
    console.log(`Found ${transactions.length} transactions to aggregate`);
    
    const result = await processDailySalesData(transactions, storeId);
    console.log(`Successfully aggregated sales data for store ${storeId}: ${result.inserted} inserted, ${result.updated} updated`);
    
    return true;
  } catch (error) {
    console.error(`Error aggregating sales data: ${error.message}`);
    throw error;
  }
}

// Store daily sales data (aggregated)
export async function processDailySalesData(salesData: any[], storeId: string) {
  let inserted = 0;
  let updated = 0;
  
  try {
    // Check if the daily_sales table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'daily_sales' }
    );
    
    if (tableCheckError) {
      console.error(`Error checking if daily_sales table exists: ${tableCheckError.message}`);
      throw new Error(`Failed to check if daily_sales table exists: ${tableCheckError.message}`);
    }
    
    if (!tableExists) {
      console.error('daily_sales table does not exist');
      throw new Error('The daily_sales table does not exist in the database');
    }
    
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

      // Ensure amount is a number before adding
      const orderAmount = parseFloat(order.amount || 0);
      if (isNaN(orderAmount)) {
        console.warn(`⚠️ Skipping order with invalid amount:`, order);
        return acc;
      }

      acc[orderDate].total_sales += orderAmount;
      acc[orderDate].order_count += 1;
      acc[orderDate].orders.push(order);

      return acc;
    }, {});

    // Store daily sales for each date
    for (const [date, data] of Object.entries(salesByDate)) {
      if (data.order_count === 0) {
        console.warn(`⚠️ Skipping date ${date} with 0 orders`);
        continue;
      }
      
      const avgOrderValue = data.total_sales / data.order_count;

      // Check if we already have a record for this date and store
      const { data: existingRecord, error: checkError } = await supabase
        .from('daily_sales')
        .select('id')
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
          updated++;
        }
      } else {
        // Create new record
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
          inserted++;
        }
      }
    }
    
    return { inserted, updated };
  } catch (error) {
    console.error(`Error processing daily sales data: ${error.message}`);
    throw error;
  }
}
