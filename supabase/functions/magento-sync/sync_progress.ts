
import { supabase } from "../_shared/db_client.ts";

// Record sync history for tracking and reporting
export async function recordSyncHistory(
  storeId: string, 
  ordersCount: number, 
  productsCount: number, 
  status: string, 
  error?: string
) {
  try {
    const syncHistoryData = {
      store_id: storeId,
      orders_synced: ordersCount,
      products_synced: productsCount,
      sync_date: new Date().toISOString(),
      status: status,
      error_message: error || null
    };
    
    const { error: insertError } = await supabase
      .from('sync_history')
      .insert(syncHistoryData);
      
    if (insertError) {
      console.error(`Failed to record sync history: ${insertError.message}`);
    }
  } catch (error) {
    console.error(`Error in recordSyncHistory: ${error.message}`);
  }
}

// Get the sync progress for a store
export async function getSyncProgress(storeId: string) {
  try {
    console.log(`Getting sync progress for store: ${storeId}`);
    
    // Fetch the latest sync progress - no table existence checks needed
    const { data, error } = await supabase
      .from('sync_progress')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error(`Error fetching sync progress: ${error.message}`);
      return { 
        success: false, 
        error: `Failed to fetch sync progress: ${error.message}`,
        inProgress: false
      };
    }
    
    // If no progress record exists
    if (!data) {
      return { success: true, inProgress: false };
    }
    
    // Check if the sync is still in progress
    const isInProgress = data.status === 'in_progress';
    
    // If sync is in progress, but it's older than 15 minutes, assume it's stale
    if (isInProgress) {
      const updatedAt = new Date(data.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      
      if (diffMinutes > 15) {
        console.log(`Sync progress is stale (${diffMinutes.toFixed(1)} minutes old), marking as failed`);
        
        // Update the record to mark it as failed
        await supabase
          .from('sync_progress')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            notes: 'Sync timed out after 15 minutes of inactivity'
          })
          .eq('id', data.id);
          
        return { 
          success: true, 
          inProgress: false, 
          isStale: true,
          lastSync: data
        };
      }
    }
    
    return {
      success: true,
      inProgress: isInProgress,
      progress: data
    };
  } catch (error) {
    console.error(`Error in getSyncProgress: ${error.message}`);
    return { 
      success: false, 
      error: `Failed to get sync progress: ${error.message}`,
      inProgress: false
    };
  }
}

// Update the sync progress
export async function updateSyncProgress(
  storeId: string, 
  status: string, 
  current: number, 
  total: number, 
  notes?: string,
  connectionId?: string
) {
  try {
    // Validate connection ID - ensure we never use PLACEHOLDER
    if (!connectionId || connectionId === "PLACEHOLDER") {
      console.error("Invalid connection_id provided to updateSyncProgress. Attempting to find valid connection_id for this store.");
      
      // Try to find a valid connection ID for this store
      const { data: validConnection, error: connectionError } = await supabase
        .from('magento_connections')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();
        
      if (connectionError || !validConnection) {
        console.error(`Cannot update sync progress: No valid connection found for store ${storeId}`);
        // Just log the error, but don't fail completely
        return;
      }
      
      connectionId = validConnection.id;
      console.log(`Found valid connection ID: ${connectionId}`);
    }
    
    // Check if we already have a progress record for this store
    const { data: existing, error: fetchError } = await supabase
      .from('sync_progress')
      .select('id')
      .eq('store_id', storeId)
      .eq('status', 'in_progress')
      .maybeSingle();
      
    if (fetchError) {
      console.error(`Error fetching sync progress: ${fetchError.message}`);
      // Continue anyway to try the upsert
    }
    
    const progressData = {
      store_id: storeId,
      status,
      orders_processed: current,
      total_orders: total,
      updated_at: new Date().toISOString(),
      notes: notes || null
    };
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('sync_progress')
        .update(progressData)
        .eq('id', existing.id);
        
      if (updateError) {
        console.error(`Error updating sync progress: ${updateError.message}`);
      }
    } else {
      // Create new record with required fields and valid connection_id
      const newProgressData = {
        ...progressData,
        connection_id: connectionId, // Use the valid connection ID, never a placeholder
        current_page: 1,
        started_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('sync_progress')
        .insert(newProgressData);
        
      if (insertError) {
        console.error(`Error inserting sync progress: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error(`Error in updateSyncProgress: ${error.message}`);
    // Just log the error, don't throw it - function should not fail totally
  }
}
