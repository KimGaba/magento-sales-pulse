-- This migration ensures the sync_progress table has the correct columns
-- Add connection_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sync_progress' 
        AND column_name = 'connection_id'
    ) THEN
        ALTER TABLE public.sync_progress ADD COLUMN connection_id UUID REFERENCES magento_connections(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add store_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sync_progress' 
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.sync_progress ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_progress_connection_id ON public.sync_progress(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_progress_store_id ON public.sync_progress(store_id);
