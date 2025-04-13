
-- This migration ensures the sync_progress table exists and has the required columns
-- We've removed the function approach in favor of direct table creation

-- Create the sync_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sync_progress (
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

-- Add new columns if they don't exist (for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sync_progress' 
    AND column_name = 'skipped_orders'
  ) THEN
    ALTER TABLE public.sync_progress 
    ADD COLUMN skipped_orders INTEGER DEFAULT 0,
    ADD COLUMN warning_message TEXT;
  END IF;
END $$;
