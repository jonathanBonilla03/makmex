-- =====================================================================
-- MakMex reporting views
-- These views hold the business logic for pricing and availability, so
-- every app (storefront, employee tool, reports) uses the same rules.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Pricing
--   unit price = latest base price (condition AA) x condition multiplier
--   line price = unit price x (1 - bundle discount) x quantity
-- ---------------------------------------------------------------------

-- Selling price per product: latest base price x condition multiplier.
-- NULL when the product has no valid price, so the store shows "Price unavailable".
CREATE OR REPLACE VIEW public.product_price WITH (security_invoker = true) AS
WITH latest_price AS (
  SELECT DISTINCT ON (product_id) product_id, price_aa, created_at
  FROM public.prices
  WHERE product_id IS NOT NULL
  ORDER BY product_id, created_at DESC NULLS LAST
)
SELECT p.id AS product_id,
       lp.price_aa AS base_price,
       c.multiplier,
       (CASE WHEN lp.price_aa > 0 AND c.multiplier IS NOT NULL
             THEN lp.price_aa * c.multiplier END)::numeric(12,2) AS price,
       lp.created_at AS price_date
FROM public.products p
LEFT JOIN latest_price lp ON lp.product_id = p.id
LEFT JOIN public.conditions c ON c.id = p.condition_id;

-- Total price per kit. Returns NULL when any component lacks a valid
-- price, so a missing price is visible instead of silently undercounted.
CREATE OR REPLACE VIEW public.kit_price_calc AS
WITH latest_price AS (
  SELECT DISTINCT ON (product_id) product_id, price_aa
  FROM public.prices
  WHERE product_id IS NOT NULL
  ORDER BY product_id, created_at DESC NULLS LAST
)
SELECT ki.kit_id,
       (CASE WHEN bool_and(COALESCE(lp.price_aa > 0, false) AND c.multiplier IS NOT NULL)
             THEN SUM(lp.price_aa * c.multiplier * (1 - COALESCE(ki.kit_discount, 0)) * ki.quantity)
        END)::numeric(12,2) AS kit_price
FROM public.kit_items ki
JOIN public.products p ON p.id = ki.product_id
LEFT JOIN latest_price lp ON lp.product_id = p.id
LEFT JOIN public.conditions c ON c.id = p.condition_id
GROUP BY ki.kit_id;

-- Total price per combo (same rules as kits).
CREATE OR REPLACE VIEW public.combo_price_calc AS
WITH latest_price AS (
  SELECT DISTINCT ON (product_id) product_id, price_aa
  FROM public.prices
  WHERE product_id IS NOT NULL
  ORDER BY product_id, created_at DESC NULLS LAST
)
SELECT ci.combo_id,
       (CASE WHEN bool_and(COALESCE(lp.price_aa > 0, false) AND c.multiplier IS NOT NULL)
             THEN SUM(lp.price_aa * c.multiplier * (1 - COALESCE(ci.combo_discount, 0)) * ci.quantity)
        END)::numeric(12,2) AS combo_price
FROM public.combo_items ci
JOIN public.products p ON p.id = ci.product_id
LEFT JOIN latest_price lp ON lp.product_id = p.id
LEFT JOIN public.conditions c ON c.id = p.condition_id
GROUP BY ci.combo_id;

-- Line-level breakdown of each kit's price (for item detail pages).
CREATE OR REPLACE VIEW public.kit_line_price_calc AS
SELECT ki.kit_id,
       ki.product_id,
       ki.role,
       ki.quantity,
       pr.price_aa,
       c.id AS condition_code,
       c.multiplier,
       COALESCE(ki.kit_discount, 0) AS kit_discount,
       (pr.price_aa * c.multiplier)::numeric(12,2) AS condition_price,
       (pr.price_aa * c.multiplier * (1 - COALESCE(ki.kit_discount, 0)))::numeric(12,2) AS discounted_unit_price,
       (pr.price_aa * c.multiplier * (1 - COALESCE(ki.kit_discount, 0)) * ki.quantity)::numeric(12,2) AS line_total
FROM public.kit_items ki
JOIN public.products p ON p.id = ki.product_id
JOIN public.prices pr ON pr.product_id = p.id
JOIN public.conditions c ON c.id = p.condition_id;

-- Line-level breakdown of each combo's price.
CREATE OR REPLACE VIEW public.combo_line_price_calc AS
SELECT ci.combo_id,
       ci.product_id,
       ci.quantity,
       pr.price_aa,
       c.id AS condition_code,
       c.multiplier,
       COALESCE(ci.combo_discount, 0) AS combo_discount,
       (pr.price_aa * c.multiplier)::numeric(12,2) AS condition_price,
       (pr.price_aa * c.multiplier * (1 - COALESCE(ci.combo_discount, 0)))::numeric(12,2) AS discounted_unit_price,
       (pr.price_aa * c.multiplier * (1 - COALESCE(ci.combo_discount, 0)) * ci.quantity)::numeric(12,2) AS line_total
FROM public.combo_items ci
JOIN public.products p ON p.id = ci.product_id
JOIN public.prices pr ON pr.product_id = p.id
JOIN public.conditions c ON c.id = p.condition_id;


-- ---------------------------------------------------------------------
-- Availability
--   How many complete bundles each warehouse can assemble right now:
--   for every component, floor(stock / quantity needed), then the minimum.
--   A component with no inventory row at a warehouse counts as zero.
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW public.kit_availability AS
WITH stock AS (
  SELECT product_id, warehouse_location, SUM(quantity) AS qty
  FROM public.inventory
  GROUP BY product_id, warehouse_location
)
SELECT w.id AS warehouse_location,
       k.id AS kit_id,
       k.specs AS kit_name,
       MIN(FLOOR(COALESCE(s.qty, 0)::numeric / ki.quantity))::integer AS max_kits_available
FROM public.kits k
JOIN public.kit_items ki ON ki.kit_id = k.id
CROSS JOIN public.warehouse w
LEFT JOIN stock s ON s.product_id = ki.product_id AND s.warehouse_location = w.id
GROUP BY w.id, k.id, k.specs;

CREATE OR REPLACE VIEW public.combo_availability AS
WITH stock AS (
  SELECT product_id, warehouse_location, SUM(quantity) AS qty
  FROM public.inventory
  GROUP BY product_id, warehouse_location
)
SELECT w.id AS warehouse_location,
       c.id AS combo_id,
       c.sku AS combo_sku,
       c.name AS combo_name,
       MIN(FLOOR(COALESCE(s.qty, 0)::numeric / ci.quantity))::integer AS max_combos_available
FROM public.combos c
JOIN public.combo_items ci ON ci.combo_id = c.id
CROSS JOIN public.warehouse w
LEFT JOIN stock s ON s.product_id = ci.product_id AND s.warehouse_location = w.id
GROUP BY w.id, c.id, c.sku, c.name;


-- ---------------------------------------------------------------------
-- Catalog and orders
-- ---------------------------------------------------------------------

-- Each product with its images as a JSON array (primary image first).
CREATE OR REPLACE VIEW public.products_with_images AS
SELECT p.id, p.description, p.model, p.condition_id, p.product_type_id,
       p.brand_id, p.power_source, p.specs, p.sku,
       COALESCE(
         jsonb_agg(jsonb_build_object('id', pi.id, 'bucket', pi.bucket, 'path', pi.path,
                                      'sort_order', pi.sort_order, 'is_primary', pi.is_primary)
                   ORDER BY pi.is_primary DESC, pi.sort_order)
           FILTER (WHERE pi.id IS NOT NULL),
         '[]'::jsonb) AS images
FROM public.products p
LEFT JOIN public.product_images pi ON pi.product_id = p.id
GROUP BY p.id;

-- One row per order with its products, kits, and combos as JSON arrays.
-- security_invoker makes it respect the RLS rules on the order tables.
CREATE OR REPLACE VIEW public.order_full_view WITH (security_invoker = true) AS
SELECT o.id AS order_id, o.order_number, o.customer_id, o.status,
       o.created_at, o.updated_at, o.subtotal, o.tax, o.total,
       COALESCE((SELECT json_agg(json_build_object('order_product_id', op.id, 'product_id', op.product_id,
                                                   'quantity', op.quantity, 'unit_price', op.unit_price,
                                                   'created_at', op.created_at, 'updated_at', op.updated_at)
                                 ORDER BY op.created_at)
                 FROM public.order_products op WHERE op.order_id = o.id), '[]'::json) AS products,
       COALESCE((SELECT json_agg(json_build_object('order_kit_id', ok.id, 'kit_id', ok.kit_id,
                                                   'quantity', ok.quantity, 'unit_price', ok.unit_price,
                                                   'created_at', ok.created_at, 'updated_at', ok.updated_at)
                                 ORDER BY ok.created_at)
                 FROM public.order_kits ok WHERE ok.order_id = o.id), '[]'::json) AS kits,
       COALESCE((SELECT json_agg(json_build_object('order_combo_id', oc.id, 'combo_id', oc.combo_id,
                                                   'quantity', oc.quantity, 'unit_price', oc.unit_price,
                                                   'created_at', oc.created_at, 'updated_at', oc.updated_at)
                                 ORDER BY oc.created_at)
                 FROM public.order_combos oc WHERE oc.order_id = o.id), '[]'::json) AS combos
FROM public.orders o;
