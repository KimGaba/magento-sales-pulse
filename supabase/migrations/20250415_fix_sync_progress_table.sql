
-- Drop the existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.create_sync_progress_table();

-- Create a properly defined function to create the sync_progress table
CREATE OR REPLACE FUNCTION public.create_sync_progress_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the table already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'sync_progress'
  ) INTO table_exists;
  
  -- If the table doesn't exist, create it
  IF NOT table_exists THEN
    CREATE TABLE public.sync_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL,
      connection_id UUID NOT NULL,
      current_page INTEGER NOT NULL DEFAULT 1,
      total_pages INTEGER,
      orders_processed INTEGER NOT NULL DEFAULT 0,
      total_orders INTEGER,
      skipped_orders INTEGER DEFAULT 0,
      warning_message TEXT,
      started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      status TEXT NOT NULL,
      error_message TEXT,
      notes TEXT
    );
    
    -- If the table was just created, return true
    RETURN true;
  END IF;
  
  -- Table already exists, check if we need to add the new columns
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sync_progress'
    AND column_name = 'skipped_orders'
  ) THEN
    ALTER TABLE public.sync_progress 
    ADD COLUMN IF NOT EXISTS skipped_orders INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS warning_message TEXT;
  END IF;
  
  -- Return true to indicate success
  RETURN true;
END;
$$;

-- Call the function to ensure the sync_progress table exists
SELECT public.create_sync_progress_table();
