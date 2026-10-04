-- migration 0001: fungsi agregat dashboard overview
-- apply: psql "$DIRECT_URL" -f database/migration/0001_overview_dashboard.sql
--
-- Semantik scope cabang (sama persis dengan branchFilter lama):
--   p_branch_id NOT NULL → filter satu cabang
--   p_branch_id NULL + p_branch_ids NULL → semua cabang
--   p_branch_id NULL + p_branch_ids = '{}' → nol baris (dulu: sql`1=0`)

CREATE OR REPLACE FUNCTION public.get_overview_dashboard(
  p_branch_id text DEFAULT NULL,
  p_branch_ids text[] DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE - 7
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'revenue', (
      SELECT COALESCE(SUM(t.amount), 0)
      FROM public.transactions t
      WHERE t.status = 'completed'
        AND ((p_branch_id IS NOT NULL AND t.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR t.branch_id = ANY(p_branch_ids))))
    ),
    'ordersAgg', (
      SELECT jsonb_build_object(
        'cnt', COUNT(*),
        'avg', COALESCE(AVG(o.total_amount), 0)
      )
      FROM public.orders o
      WHERE ((p_branch_id IS NOT NULL AND o.branch_id = p_branch_id)
        OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR o.branch_id = ANY(p_branch_ids))))
    ),
    'activeBranches', (
      SELECT COUNT(*) FROM public.branches b WHERE b.status = 'active'
    ),
    'revenueData', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.date)
      FROM (
        SELECT d.date::text AS date, SUM(d.amount) AS revenue
        FROM public.daily_setorans d
        WHERE d.status = 'approved'
          AND d.date >= p_start_date
          AND ((p_branch_id IS NOT NULL AND d.branch_id = p_branch_id)
            OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR d.branch_id = ANY(p_branch_ids))))
        GROUP BY d.date
      ) x
    ), '[]'::jsonb),
    'branchRevenue', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.total DESC)
      FROM (
        SELECT b.name AS branch, SUM(d.amount) AS total, COUNT(*) AS count
        FROM public.daily_setorans d
        INNER JOIN public.branches b ON d.branch_id = b.id
        WHERE d.status = 'approved'
          AND ((p_branch_id IS NOT NULL AND d.branch_id = p_branch_id)
            OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR d.branch_id = ANY(p_branch_ids))))
        GROUP BY b.id, b.name
      ) x
    ), '[]'::jsonb),
    'paymentMethods', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.count DESC)
      FROM (
        SELECT t.payment_method AS method, COUNT(*) AS count, SUM(t.amount) AS amount
        FROM public.transactions t
        WHERE ((p_branch_id IS NOT NULL AND t.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR t.branch_id = ANY(p_branch_ids))))
        GROUP BY t.payment_method
      ) x
    ), '[]'::jsonb),
    'orderStatuses', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.count DESC)
      FROM (
        SELECT o.status AS status, COUNT(*) AS count
        FROM public.orders o
        WHERE ((p_branch_id IS NOT NULL AND o.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR o.branch_id = ANY(p_branch_ids))))
        GROUP BY o.status
      ) x
    ), '[]'::jsonb),
    'shiftData', COALESCE((
      SELECT jsonb_agg(x)
      FROM (
        SELECT COUNT(*) AS count, COALESCE(SUM(d.amount), 0) AS amount
        FROM public.daily_setorans d
        WHERE d.status = 'approved'
          AND ((p_branch_id IS NOT NULL AND d.branch_id = p_branch_id)
            OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR d.branch_id = ANY(p_branch_ids))))
      ) x
    ), '[]'::jsonb),
    'topItems', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.qty DESC)
      FROM (
        SELECT oi.name_snapshot AS name, SUM(oi.qty) AS qty, SUM(oi.subtotal) AS revenue
        FROM public.order_items oi
        INNER JOIN public.orders o ON oi.order_id = o.id
        WHERE ((p_branch_id IS NOT NULL AND o.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR o.branch_id = ANY(p_branch_ids))))
        GROUP BY oi.name_snapshot
        ORDER BY SUM(oi.qty) DESC
        LIMIT 5
      ) x
    ), '[]'::jsonb),
    'recentOrders', COALESCE((
      SELECT jsonb_agg(x ORDER BY x."createdAt" DESC)
      FROM (
        SELECT o.id AS id, o.order_number AS "orderNumber", o.status AS status,
          o.total_amount AS "totalAmount", b.name AS "branchName", o.created_at AS "createdAt"
        FROM public.orders o
        INNER JOIN public.branches b ON o.branch_id = b.id
        WHERE ((p_branch_id IS NOT NULL AND o.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR o.branch_id = ANY(p_branch_ids))))
        ORDER BY o.created_at DESC
        LIMIT 5
      ) x
    ), '[]'::jsonb),
    'customerTiers', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.count DESC)
      FROM (
        SELECT c.loyalty_tier AS tier, COUNT(*) AS count
        FROM public.customers c
        GROUP BY c.loyalty_tier
      ) x
    ), '[]'::jsonb),
    'categoryPerf', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.qty DESC)
      FROM (
        SELECT mc.name AS category, SUM(oi.qty) AS qty, SUM(oi.subtotal) AS revenue
        FROM public.order_items oi
        INNER JOIN public.menu_items mi ON oi.menu_item_id = mi.id
        INNER JOIN public.menu_categories mc ON mi.category_id = mc.id
        INNER JOIN public.orders o ON oi.order_id = o.id
        WHERE ((p_branch_id IS NOT NULL AND o.branch_id = p_branch_id)
          OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR o.branch_id = ANY(p_branch_ids))))
        GROUP BY mc.id, mc.name
      ) x
    ), '[]'::jsonb),
    'branchRanking', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.revenue DESC)
      FROM (
        SELECT b.id AS "branchId", b.name AS branch, SUM(d.amount) AS revenue, COUNT(*) AS "setoranCount"
        FROM public.daily_setorans d
        INNER JOIN public.branches b ON d.branch_id = b.id
        WHERE d.status = 'approved'
          AND ((p_branch_id IS NOT NULL AND d.branch_id = p_branch_id)
            OR (p_branch_id IS NULL AND (p_branch_ids IS NULL OR d.branch_id = ANY(p_branch_ids))))
        GROUP BY b.id, b.name
      ) x
    ), '[]'::jsonb)
  );
$$;
