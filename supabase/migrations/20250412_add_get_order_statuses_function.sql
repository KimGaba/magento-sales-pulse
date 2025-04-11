
-- Function to get unique order statuses from all transactions
CREATE OR REPLACE FUNCTION public.get_unique_order_statuses()
RETURNS TABLE (status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.metadata->>'status' as status
  FROM transactions t
  WHERE t.metadata->>'status' IS NOT NULL
  ORDER BY status;
END;
$$;
