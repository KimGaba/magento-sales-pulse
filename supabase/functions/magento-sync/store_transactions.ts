
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

      // Prepare order items data in a structured format
      const orderItems = Array.isArray(order.items) ? order.items.map(item => ({
        sku: item.sku || '',
        name: item.name || '',
        price: parseFloat(item.price) || 0,
        qty_ordered: parseFloat(item.qty_ordered) || 1,
        row_total: parseFloat(item.row_total) || 0,
        product_id: item.product_id || null,
        product_type: item.product_type || ''
      })) : [];

      // Extract payment and shipping information
      const paymentMethod = order.payment?.method || order.order_data?.payment_method || 'unknown';
      const shippingMethod = order.shipping_description || order.order_data?.shipping_method || 'unknown';
      const orderStatus = order.status || 'unknown';

      // Create a detailed metadata object with all the information we want to store
      const metadata = {
        store_view: order.store_view,
        customer_group: order.customer_group,
        status: orderStatus,
        items_count: order.items_count || orderItems.length,
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        // Add the new detailed order items
        order_items: orderItems
      };

      let transactionDate = order.transaction_date;
      if (transactionDate) {
        try {
          transactionDate = new Date(transactionDate).toISOString();
        } catch (e) {
          console.warn(`⚠️ Skipping order with invalid transaction_date: ${JSON.stringify(order, null, 2)}`);
          continue; // Skip this order
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
