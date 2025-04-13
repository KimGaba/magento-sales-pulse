
import { supabase } from "../_shared/db_client.ts";

export async function storeTransactions(transactions: any[], storeId: string): Promise<{ success: boolean; stats: any }> {
  console.log(`Storing ${transactions.length} transactions for store ${storeId}`);
  
  if (!storeId) {
    console.error("No store ID provided for transactions");
    return { success: false, stats: { new: 0, updated: 0, skipped: 0, errors: 0 } };
  }
  
  // Stats tracking
  let newCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Track invalid data for reporting
  let invalidDates = 0;
  let missingExternalIds = 0;
  let outsideSyncWindow = 0;
  
  // Process each transaction
  const processedTransactions: any[] = [];
  
  for (const transaction of transactions) {
    try {
      // Extract essential data
      const externalId = transaction.external_id;
      let transactionDate = transaction.transaction_date;
      const amount = parseFloat(transaction.amount) || 0;
      const customerId = transaction.customer_id || null;
      const customerName = transaction.customer_name || null;
      const storeView = transaction.store_view?.toString() || 'default';
      const customerGroup = transaction.customer_group?.toString() || null;
      const status = transaction.status || 'unknown';
      const productId = transaction.product_id || null;
      const items = transaction.items || 0;
      const metadata = {
        items_data: transaction.items_data || [],
        status: status,
        store_view: storeView,
        customer_group: customerGroup,
        ...transaction.order_data
      };
      
      // Validate critical fields
      if (!externalId) {
        console.warn("Skipping transaction without external ID:", transaction);
        skippedCount++;
        missingExternalIds++;
        continue;
      }
      
      // Parse and validate transaction date
      let parsedDate: Date | null = null;
      if (transactionDate) {
        try {
          parsedDate = new Date(transactionDate);
          // Check if date is valid
          if (isNaN(parsedDate.getTime())) {
            console.warn(`⚠️ Invalid date format in order ${externalId}: ${transactionDate}`);
            invalidDates++;
            // Use current date as fallback
            parsedDate = new Date();
            transactionDate = parsedDate.toISOString();
          }
          
          // Check if this date is outside the sync window - if so, we'll mark it differently
          if (transaction.outside_sync_window === true) {
            console.warn(`⚠️ Order ${externalId} is outside the subscription sync window: ${transactionDate}`);
            outsideSyncWindow++;
            skippedCount++;
            continue;
          }
        } catch (e) {
          console.warn(`⚠️ Invalid date format in order ${externalId}: ${transactionDate}`);
          invalidDates++;
          // Use current date as fallback
          parsedDate = new Date();
          transactionDate = parsedDate.toISOString();
        }
      } else {
        console.warn(`⚠️ Missing transaction date in order ${externalId}`);
        invalidDates++;
        // Use current date as fallback
        parsedDate = new Date();
        transactionDate = parsedDate.toISOString();
      }
      
      // Check if the transaction exists
      const { data: existingTransaction, error: fetchError } = await supabase
        .from('transactions')
        .select('id, external_id, transaction_date')
        .eq('store_id', storeId)
        .eq('external_id', externalId)
        .maybeSingle();
      
      if (fetchError) {
        console.error(`Error fetching transaction ${externalId}:`, fetchError.message);
        errorCount++;
        continue;
      }
      
      // Prepare transaction data
      const transactionData = {
        external_id: externalId,
        transaction_date: transactionDate,
        amount,
        store_id: storeId,
        customer_id: customerId,
        customer_name: customerName,
        product_id: productId,
        items,
        metadata
      };
      
      // Insert or update the transaction
      if (existingTransaction) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', existingTransaction.id);
        
        if (updateError) {
          console.error(`Error updating transaction ${externalId}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          processedTransactions.push(transactionData);
        }
      } else {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionData);
        
        if (insertError) {
          console.error(`Error inserting transaction ${externalId}:`, insertError.message);
          errorCount++;
        } else {
          newCount++;
          processedTransactions.push(transactionData);
        }
      }
    } catch (error) {
      console.error(`Error processing transaction:`, error);
      errorCount++;
    }
  }
  
  console.log(`Completed processing ${transactions.length} transactions.`);
  console.log(`Results: ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
  console.log(`Invalid data details: ${invalidDates} invalid dates, ${missingExternalIds} missing external IDs, ${outsideSyncWindow} outside sync window`);
  
  return {
    success: true,
    stats: {
      new: newCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      invalidDates,
      missingExternalIds,
      outsideSyncWindow
    }
  };
}
