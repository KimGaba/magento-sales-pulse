
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Database } from "../../_shared/database_types.ts";

const supabaseUrl = "https://vlkcnndgtarduplyedyp.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Helper function to get the last sync date for a specific data type
export async function getLastSyncDate(storeId: string, dataType: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc(
      'get_last_sync_date',
      { 
        store_id_param: storeId,
        data_type_param: dataType
      }
    );
    
    if (error) {
      console.error(`Error getting last sync date for ${dataType}:`, error.message);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getLastSyncDate:`, error);
    return null;
  }
}

// Helper function to update the last sync date for a specific data type
export async function updateLastSyncDate(storeId: string, dataType: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_last_sync_date', {
      store_id_param: storeId,
      data_type_param: dataType,
      sync_date: new Date().toISOString()
    });
    
    if (error) {
      console.error(`Error updating last sync date for ${dataType}:`, error.message);
      throw error;
    }
  } catch (error) {
    console.error(`Error in updateLastSyncDate:`, error);
  }
}

// Helper to fetch a Magento connection
export async function getMagentoConnection(connectionId: string) {
  try {
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching Magento connection:`, error);
    throw error;
  }
}

// Helper to update sync progress
export async function updateSyncProgress(
  storeId: string, 
  status: string, 
  current: number, 
  total: number, 
  notes?: string,
  connectionId?: string
) {
  try {
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
    } else if (connectionId) {
      // Create new record with required fields and valid connection_id
      const newProgressData = {
        ...progressData,
        connection_id: connectionId,
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
  }
}

// Helper to record sync history
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
