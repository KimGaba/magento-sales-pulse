import { MagentoConnection } from "../types.ts";
import { supabase, getLastSyncDate, updateLastSyncDate } from "../utils/supabaseClient.ts";
import { fetchFromMagento } from "../utils/magentoClient.ts";
import logger from "../utils/logger.ts";

const log = logger.createLogger("orders");

/**
 * Fetches all orders from Magento API with pagination
 */
export async function fetchOrders(
  connection: MagentoConnection,
  maxPages: number = 1000,
  pageSize: number = 100,
  lastSyncDate: string | null = null
): Promise<{ orders: any[], totalCount: number }> {
  try {
    let allOrders: any[] = [];
    let currentPage = 1;
    let ordersProcessed = 0;
    
    console.log(`Last sync date for orders: ${lastSyncDate}`);
    
    while (currentPage <= maxPages) {
      console.log(`Fetching orders page ${currentPage} with pageSize ${pageSize}`);
      
      let apiUrl = `${connection.store_url}/rest/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`;
      
      // Add updated_at filter if we have a last sync date
      if (lastSyncDate) {
        const formattedDate = new Date(lastSyncDate).toISOString();
        apiUrl += `&searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(formattedDate)}&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
      }
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Magento API error (${response.status}): ${errorText}`);
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.items) {
          const orders = data.items;
          allOrders = [...allOrders, ...orders];
          ordersProcessed += orders.length;
          
          console.log(`Fetched ${orders.length} orders, total processed: ${ordersProcessed}`);
          
          if (orders.length < pageSize) {
            console.log('No more orders to fetch. Breaking pagination.');
            break;
          }
        } else {
          console.warn('No orders found on this page, stopping pagination.');
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}: ${error.message}`);
        throw error;
      }
      
      currentPage++;
    }
    
    console.log(`Successfully fetched ${allOrders.length} orders.`);
    return { orders: allOrders, totalCount: allOrders.length };
  } catch (error) {
    console.error(`Error in fetchOrders: ${error.message}`);
    throw error;
  }
}

/**
 * Stores orders as transactions in the database
 */
export async function storeOrders(orders: any[], storeId: string): Promise<{ 
  success: boolean; 
  stats: {
    new: number;
    updated: number;
    skipped: number;
    errors: number;
    invalidDates: number;
    missingExternalIds: number;
  }
}> {
  console.log(`Storing ${orders.length} orders for store ${storeId}`);
  
  if (!storeId) {
    console.error("No store ID provided for orders");
    return { success: false, stats: { new: 0, updated: 0, skipped: 0, errors: 0, invalidDates: 0, missingExternalIds: 0 } };
  }
  
  // Stats tracking
  let newCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let invalidDates = 0;
  let missingExternalIds = 0;
  
  // Process each order
  for (const order of orders) {
    try {
      // Extract essential data
      const externalId = order.increment_id || order.entity_id.toString();
      let transactionDate = order.created_at;
      const amount = parseFloat(order.grand_total) || 0;
      const customerId = order.customer_id || null;
      const customerName = order.customer_firstname 
        ? `${order.customer_firstname} ${order.customer_lastname || ''}`.trim()
        : null;
      const storeView = order.store_name || 'default';
      const status = order.status || 'unknown';
      
      // Prepare order items data
      const items = order.items?.length || 0;
      const itemsData = order.items || [];
      
      // Gather product data if available - first item for now
      const productId = null; // Will be linked through item data
      
      // Combine all metadata
      const metadata = {
        items_data: itemsData,
        status: status,
        store_view: storeView,
        customer_group: order.customer_group_id?.toString() || null,
        order_data: {
          entity_id: order.entity_id,
          increment_id: order.increment_id,
          created_at: order.created_at,
          state: order.state,
          shipping_description: order.shipping_description,
          payment_method: order.payment.method,
          total_qty_ordered: order.total_qty_ordered,
          total_item_count: order.total_item_count,
          discount_amount: order.discount_amount,
          shipping_amount: order.shipping_amount,
          tax_amount: order.tax_amount
        }
      };
      
      // Validate critical fields
      if (!externalId) {
        console.warn("Skipping order without external ID:", order);
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
        }
      }
    } catch (error) {
      console.error(`Error processing order:`, error);
      errorCount++;
    }
  }
  
  console.log(`Completed processing ${orders.length} orders.`);
  console.log(`Results: ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
  console.log(`Invalid data details: ${invalidDates} invalid dates, ${missingExternalIds} missing external IDs`);
  
  return {
    success: true,
    stats: {
      new: newCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      invalidDates,
      missingExternalIds
    }
  };
}

/**
 * Orchestrates the fetch and storage of order data
 */
export async function syncOrders(
  connection: MagentoConnection, 
  storeId: string,
  maxPages?: number,
  pageSize?: number
): Promise<{ 
  success: boolean;
  stats: {
    ordersCount: number;
    processedCount: number;
    skippedCount: number;
    errorCount: number;
  }
}> {
  try {
    // Get last sync date for orders
    const lastSyncDate = await getLastSyncDate(storeId, 'orders');
    
    // Fetch orders from Magento
    const { orders, totalCount } = await fetchOrders(connection, maxPages, pageSize, lastSyncDate);
    
    if (orders.length === 0) {
      console.log('No orders found for the specified criteria');
      
      // Update last sync date even if no orders were found
      await updateLastSyncDate(storeId, 'orders', new Date().toISOString());
      
      return {
        success: true,
        stats: {
          ordersCount: 0,
          processedCount: 0,
          skippedCount: 0,
          errorCount: 0
        }
      };
    }
    
    // Store orders as transactions
    const storeResult = await storeOrders(orders, storeId);
    
    // Update last sync date
    await updateLastSyncDate(storeId, 'orders', new Date().toISOString());
    
    const processedCount = storeResult.stats.new + storeResult.stats.updated;
    
    return {
      success: true,
      stats: {
        ordersCount: orders.length,
        processedCount,
        skippedCount: storeResult.stats.skipped,
        errorCount: storeResult.stats.errors
      }
    };
  } catch (error) {
    console.error(`Error syncing orders: ${error.message}`);
    throw error;
  }
}
