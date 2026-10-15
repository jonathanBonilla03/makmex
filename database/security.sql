-- =====================================================================
-- MakMex row-level security (RLS)
-- RLS is enabled on every table. The storefront uses the public anon key,
-- so these policies decide what a browser can see.
--
--   Catalog tables   readable by everyone (the store needs them)
--   Sales tables     no browser access at all; only the service role
--                    (dashboard and back-end tools) can read or write them
-- =====================================================================

ALTER TABLE public.brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_kits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_combos   ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- Catalog: public read
-- ---------------------------------------------------------------------

CREATE POLICY "Enable read access for all users" ON public.brands         FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.product_types  FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.conditions     FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.warehouse      FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.products       FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.prices         FOR SELECT USING (true);
CREATE POLICY "public read product_images"       ON public.product_images FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for all users" ON public.inventory      FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.kits           FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.kit_items      FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.combos         FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.combo_items    FOR SELECT USING (true);

-- Signed-in staff can add reference data.
CREATE POLICY "Enable insert for authenticated users only" ON public.conditions    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.product_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.discounts     FOR INSERT TO authenticated WITH CHECK (true);


-- ---------------------------------------------------------------------
-- Sales: intentionally no policies.
-- customers, orders, order_products, order_kits, order_combos hold
-- personal data and order history. With RLS on and no policies, the
-- anon and authenticated roles get zero rows. Guest checkout will move
-- to a server-side function so the browser never touches these tables.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- Functions
-- handle_new_user() runs only as the on_auth_user_created trigger, so it
-- is not callable through the public API.
-- ---------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
