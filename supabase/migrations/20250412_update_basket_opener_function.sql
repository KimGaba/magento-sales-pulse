
-- Update the get_basket_opener_products function to support order status filtering
CREATE OR REPLACE FUNCTION public.get_basket_opener_products(
  start_date timestamp with time zone, 
  end_date timestamp with time zone, 
  store_filter uuid[] DEFAULT NULL::uuid[],
  customer_group text DEFAULT NULL,
  store_view text DEFAULT NULL,
  order_statuses text[] DEFAULT NULL
)
RETURNS TABLE(product_id uuid, product_name text, opener_count bigint, total_appearances bigint, opener_score integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH multi_product_transactions AS (
    -- Get transaction IDs that have multiple products (using product_id count)
    SELECT DISTINCT t.customer_id, t.transaction_date
    FROM transactions t
    WHERE t.transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR t.store_id = ANY(store_filter))
      AND (customer_group IS NULL OR t.metadata->>'customer_group' = customer_group)
      AND (store_view IS NULL OR t.metadata->>'store_view' = store_view)
      AND (order_statuses IS NULL OR t.metadata->>'status' = ANY(order_statuses))
      AND t.customer_id IS NOT NULL
    GROUP BY t.customer_id, t.transaction_date
    HAVING COUNT(DISTINCT t.product_id) > 1
  ),
  first_products AS (
    -- For each multi-product transaction, find the first product added
    SELECT 
      t.product_id,
      COUNT(*) as opener_count
    FROM transactions t
    JOIN multi_product_transactions mpt 
      ON t.customer_id = mpt.customer_id 
      AND t.transaction_date = mpt.transaction_date
    WHERE t.transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR t.store_id = ANY(store_filter))
      AND (customer_group IS NULL OR t.metadata->>'customer_group' = customer_group)
      AND (store_view IS NULL OR t.metadata->>'store_view' = store_view)
      AND (order_statuses IS NULL OR t.metadata->>'status' = ANY(order_statuses))
      AND t.product_id IS NOT NULL
    GROUP BY t.product_id
  ),
  product_appearances AS (
    -- Count total appearances of each product in multi-product orders
    SELECT 
      t.product_id,
      COUNT(*) as total_count
    FROM transactions t
    JOIN multi_product_transactions mpt 
      ON t.customer_id = mpt.customer_id 
      AND t.transaction_date = mpt.transaction_date
    WHERE t.transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR t.store_id = ANY(store_filter))
      AND (customer_group IS NULL OR t.metadata->>'customer_group' = customer_group)
      AND (store_view IS NULL OR t.metadata->>'store_view' = store_view)
      AND (order_statuses IS NULL OR t.metadata->>'status' = ANY(order_statuses))
      AND t.product_id IS NOT NULL
    GROUP BY t.product_id
  )
  SELECT 
    fp.product_id,
    p.name as product_name,
    fp.opener_count,
    pa.total_count as total_appearances,
    GREATEST(0, LEAST(100, CAST(ROUND((fp.opener_count::FLOAT / pa.total_count::FLOAT) * 100) AS INTEGER))) as opener_score
  FROM first_products fp
  JOIN product_appearances pa ON fp.product_id = pa.product_id
  LEFT JOIN products p ON fp.product_id = p.id
  WHERE pa.total_count > 0
  ORDER BY opener_score DESC, fp.opener_count DESC
  LIMIT 100;
END;
$function$;
