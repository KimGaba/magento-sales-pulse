
-- Function to safely delete all data related to a specific store
CREATE OR REPLACE FUNCTION public.delete_store_data(target_store_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Delete related data first due to foreign key constraints
  DELETE FROM public.transactions WHERE store_id = target_store_id;
  DELETE FROM public.daily_sales WHERE store_id = target_store_id;
  DELETE FROM public.products WHERE store_id = target_store_id;
  DELETE FROM public.sync_progress WHERE store_id = target_store_id;
  DELETE FROM public.magento_store_views WHERE store_id = target_store_id::text;

  -- Delete the connection itself
  DELETE FROM public.magento_connections WHERE store_id = target_store_id;

  -- Finally delete the store
  DELETE FROM public.stores WHERE id = target_store_id;
END;
$$;
