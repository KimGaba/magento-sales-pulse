
-- Add new columns to sync_progress table
ALTER TABLE public.sync_progress 
ADD COLUMN IF NOT EXISTS data_type TEXT DEFAULT 'orders',
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Create function to get the last sync date for a specific store and data type
CREATE OR REPLACE FUNCTION public.get_last_sync_date(
  store_id_param UUID,
  data_type_param TEXT DEFAULT 'orders'
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_sync TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Try to get last_sync_date from sync_progress first
  SELECT last_sync_date INTO last_sync
  FROM public.sync_progress
  WHERE store_id = store_id_param AND data_type = data_type_param
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If no sync_progress entry found, fall back to store's last_sync_date
  IF last_sync IS NULL THEN
    SELECT last_sync_date INTO last_sync
    FROM public.stores
    WHERE id = store_id_param;
  END IF;
  
  RETURN last_sync;
END;
$$;

-- Create function to update the last sync date for a specific store and data type
CREATE OR REPLACE FUNCTION public.update_last_sync_date(
  store_id_param UUID,
  data_type_param TEXT,
  sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_id UUID;
BEGIN
  -- Check if a record exists for this store_id and data_type
  SELECT id INTO progress_id
  FROM public.sync_progress
  WHERE store_id = store_id_param AND data_type = data_type_param
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Update existing record or insert new one
  IF progress_id IS NOT NULL THEN
    UPDATE public.sync_progress
    SET last_sync_date = sync_date,
        updated_at = NOW()
    WHERE id = progress_id;
  ELSE
    INSERT INTO public.sync_progress (
      store_id, 
      data_type, 
      status, 
      orders_processed, 
      last_sync_date
    )
    VALUES (
      store_id_param, 
      data_type_param, 
      'completed', 
      0, 
      sync_date
    );
  END IF;
  
  -- Also update the store's last_sync_date for backward compatibility
  UPDATE public.stores
  SET last_sync_date = sync_date,
      updated_at = NOW()
  WHERE id = store_id_param;
END;
$$;
