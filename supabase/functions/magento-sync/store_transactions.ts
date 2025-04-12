
// Import from the shared DB client
import { supabase } from "../_shared/db_client.ts";

// Store individual transactions from Magento orders
export async function storeTransactions(ordersData: any[], storeId: string) {
  try {
    console.log(`Storing ${ordersData.length} transactions for store ${storeId}`);
    
    let newCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const order of ordersData) {
      try {
        // Skip if no external_id is present
        if (!order.external_id) {
          console.warn(`Skipping order without external_id: ${JSON.stringify(order, null, 2)}`);
          errorCount++;
          continue;
        }

        // Check if transaction already exists
        const { data: existingTransaction, error: checkError } = await supabase
          .from('transactions')
          .select('id, external_id, amount, transaction_date, metadata')
          .eq('store_id', storeId)
          .eq('external_id', order.external_id)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking for existing transaction: ${checkError.message}`);
          errorCount++;
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
            errorCount++;
            continue;
          }
        } else {
          transactionDate = new Date().toISOString();
        }

        if (existingTransaction) {
          // Explicitly log that we're skipping this transaction
          console.log(`Skipping existing transaction for order ${order.external_id}`);
          skippedCount++;
          
          // Update the existing transaction with new data
          // This ensures we have the latest information even for existing orders
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              amount: order.amount,
              transaction_date: transactionDate,
              metadata: metadata
            })
            .eq('id', existingTransaction.id);
            
          if (updateError) {
            console.error(`Error updating transaction for order ${order.external_id}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Updated transaction for order ${order.external_id}`);
            updatedCount++;
          }
          
          continue;
        }

        // Insert new transaction
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
          errorCount++;
        } else {
          console.log(`Inserted transaction for order ${order.external_id}`);
          newCount++;
        }
      } catch (orderError) {
        console.error(`Error processing order ${order?.external_id || 'unknown'}: ${orderError.message}`);
        errorCount++;
      }
    }

    console.log(`Completed processing ${ordersData.length} transactions.`);
    console.log(`Results: ${newCount} new, ${skippedCount} skipped, ${updatedCount} updated, ${errorCount} errors`);
    
    return { 
      success: true, 
      count: ordersData.length,
      stats: {
        new: newCount,
        skipped: skippedCount,
        updated: updatedCount,
        errors: errorCount
      }
    };
  } catch (error) {
    console.error(`Error storing transactions: ${error.message}`);
    throw error;
  }
}
