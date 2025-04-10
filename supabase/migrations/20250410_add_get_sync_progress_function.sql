
-- Create a function to get sync progress for a store
CREATE OR REPLACE FUNCTION public.get_sync_progress(store_id_param UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', sp.id,
      'store_id', sp.store_id,
      'connection_id', sp.connection_id,
      'current_page', sp.current_page,
      'total_pages', sp.total_pages,
      'orders_processed', sp.orders_processed,
      'total_orders', sp.total_orders,
      'status', sp.status,
      'started_at', sp.started_at,
      'updated_at', sp.updated_at,
      'error_message', sp.error_message
    )
  FROM 
    public.sync_progress sp
  WHERE 
    sp.store_id = store_id_param
  ORDER BY 
    sp.updated_at DESC
  LIMIT 1;
END;
$$;
