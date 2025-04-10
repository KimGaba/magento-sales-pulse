
// Import from the shared DB client
import { supabase } from "../_shared/db_client.ts";

// Store individual transactions from Magento orders
export async function storeTransactions(ordersData: any[], storeId: string) {
  try {
    console.log(`Storing ${ordersData.length} transactions for store ${storeId}`);
    
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

      const metadata = {
        store_view: order.store_view,
        customer_group: order.customer_group,
        status: order.status,
        items_count: order.items,
        payment_method: order.order_data?.payment_method,
        shipping_method: order.order_data?.shipping_method,
        customer_name: order.customer_name
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
