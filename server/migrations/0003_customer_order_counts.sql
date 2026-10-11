-- migration 0003: agregat jumlah order per customer
-- apply: psql "$DIRECT_URL" -f database/migrations/0003_customer_order_counts.sql
--
-- Menggantikan fetch `orders.customer_id`
-- Agregasi GROUP BY dikerjakan di DB (pakai index orders_customer_id_idx),

CREATE OR REPLACE FUNCTION public.get_customer_order_counts()
RETURNS TABLE(customer_id text, order_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT o.customer_id AS customer_id, COUNT(*) AS order_count
  FROM public.orders o
  WHERE o.customer_id IS NOT NULL
  GROUP BY o.customer_id
$$;
