
-- Create a function to create the sync_progress table if it doesn't exist
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

-- Ensure the daily_sales table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'daily_sales'
  ) THEN
    CREATE TABLE public.daily_sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL,
      date DATE NOT NULL,
      total_sales NUMERIC NOT NULL DEFAULT 0,
      order_count INTEGER NOT NULL DEFAULT 0,
      average_order_value NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Create a unique constraint on store_id and date
    CREATE UNIQUE INDEX daily_sales_store_date_idx ON public.daily_sales (store_id, date);
  END IF;
END;
$$;

-- Call the function to create the sync_progress table if it doesn't exist
SELECT public.create_sync_progress_table();
