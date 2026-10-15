-- =====================================================================
-- MakMex database schema (PostgreSQL 17 on Supabase)
-- Exported from the live project and organized for readability.
--
-- Layout
--   1. Reference data   brands, product_types, conditions, warehouse
--   2. Catalog          products, prices, product_images, discounts
--   3. Inventory        inventory (one row per product per warehouse)
--   4. Bundles          kits + kit_items, combos + combo_items
--   5. Sales            customers, orders, order_products/kits/combos
--   6. Foreign keys
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Reference data
-- ---------------------------------------------------------------------

CREATE SEQUENCE public.brands_id_seq;
CREATE TABLE public.brands (
  id   integer NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  name text    NOT NULL,
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_name_key UNIQUE (name)
);

CREATE SEQUENCE public.product_types_id_seq;
CREATE TABLE public.product_types (
  id   integer NOT NULL DEFAULT nextval('product_types_id_seq'::regclass),
  name text    NOT NULL,
  CONSTRAINT product_types_pkey PRIMARY KEY (id)
);

-- Condition grades (AA = new ... F). The multiplier is applied to the
-- base AA price, so a used item is priced as a fraction of new.
CREATE TABLE public.conditions (
  id                text    NOT NULL,
  general_condition text    NOT NULL,
  full_description  text    NOT NULL,
  multiplier        numeric NOT NULL,
  CONSTRAINT conditions_pkey PRIMARY KEY (id),
  CONSTRAINT conditions_multiplier_positive CHECK (multiplier > 0 AND multiplier <= 1)
);

CREATE TABLE public.warehouse (
  id      text NOT NULL,
  address character varying,
  name    text,
  phone   text,
  email   text,
  CONSTRAINT warehouse_pkey PRIMARY KEY (id)
);


-- ---------------------------------------------------------------------
-- 2. Catalog
-- ---------------------------------------------------------------------

CREATE TABLE public.products (
  id              uuid                  NOT NULL DEFAULT gen_random_uuid(),
  description     text,
  model           character varying(50) NOT NULL,
  condition_id    text,
  product_type_id integer,
  brand_id        integer,
  power_source    text,
  specs           text,
  sku             text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Dated price history. price_aa is the base price for condition AA;
-- views pick the most recent row per product.
CREATE TABLE public.prices (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  created_at date,
  price_aa   numeric(10,2),
  CONSTRAINT prices_pkey PRIMARY KEY (id)
);

CREATE TABLE public.product_images (
  id         uuid    NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid    NOT NULL,
  bucket     text    NOT NULL DEFAULT 'product-images',
  path       text    NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_bucket_path_key UNIQUE (bucket, path),
  CONSTRAINT unique_product_image_path UNIQUE (product_id, path)
);

CREATE TABLE public.discounts (
  id                     uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id             uuid,
  kit_discount_percent   numeric(5,2),
  combo_discount_percent numeric(5,2),
  created_at             timestamp without time zone DEFAULT now(),
  CONSTRAINT discounts_pkey PRIMARY KEY (id)
);


-- ---------------------------------------------------------------------
-- 3. Inventory
-- ---------------------------------------------------------------------

CREATE TABLE public.inventory (
  id                 uuid    NOT NULL DEFAULT gen_random_uuid(),
  product_id         uuid,
  quantity           integer DEFAULT 0,
  warehouse_location text,
  last_updated       timestamp without time zone DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  -- Added after a data-quality audit found 30 duplicated product/warehouse pairs.
  CONSTRAINT inventory_product_warehouse_unique UNIQUE (product_id, warehouse_location),
  CONSTRAINT inventory_quantity_check CHECK (quantity >= 0)
);


-- ---------------------------------------------------------------------
-- 4. Bundles: kits (tool + battery + charger) and combos
-- ---------------------------------------------------------------------

CREATE TABLE public.kits (
  id              uuid                  NOT NULL DEFAULT gen_random_uuid(),
  specs           text                  NOT NULL,
  description     text,
  sku             character varying(50) NOT NULL,
  brand_id        integer,
  product_type_id integer,
  CONSTRAINT kits_pkey PRIMARY KEY (id),
  CONSTRAINT kits_sku_key UNIQUE (sku)
);

-- Junction table: which products make up each kit, in what role and quantity.
CREATE TABLE public.kit_items (
  id           uuid    NOT NULL DEFAULT gen_random_uuid(),
  kit_id       uuid,
  product_id   uuid,
  role         text,
  quantity     integer DEFAULT 1,
  kit_discount numeric DEFAULT 0,
  CONSTRAINT kit_items_pkey PRIMARY KEY (id),
  CONSTRAINT kit_items_role_check CHECK (role = ANY (ARRAY['tool', 'battery', 'charger'])),
  CONSTRAINT kit_items_quantity_check CHECK (quantity > 0)
);

CREATE TABLE public.combos (
  id          uuid                  NOT NULL DEFAULT gen_random_uuid(),
  name        text                  NOT NULL,
  description text,
  sku         character varying(50) NOT NULL,
  image_url   text,
  brand_id    integer,
  CONSTRAINT combos_pkey PRIMARY KEY (id),
  CONSTRAINT combos_sku_key UNIQUE (sku)
);

CREATE TABLE public.combo_items (
  id             uuid    NOT NULL DEFAULT gen_random_uuid(),
  combo_id       uuid,
  product_id     uuid,
  quantity       integer DEFAULT 1,
  condition      text,
  combo_discount numeric DEFAULT 0,
  CONSTRAINT combo_items_pkey PRIMARY KEY (id),
  CONSTRAINT combo_items_quantity_check CHECK (quantity > 0)
);


-- ---------------------------------------------------------------------
-- 5. Sales
-- ---------------------------------------------------------------------

CREATE TABLE public.customers (
  id           uuid   NOT NULL DEFAULT gen_random_uuid(),
  user_id      bigint NOT NULL,
  name         text   NOT NULL DEFAULT '',
  email        text   NOT NULL DEFAULT '',
  phone_number text   DEFAULT '',
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_key UNIQUE (user_id),
  CONSTRAINT customers_name_check CHECK (length(name) <= 30)
);

CREATE TABLE public.orders (
  id           uuid          NOT NULL DEFAULT gen_random_uuid(),
  customer_id  uuid          NOT NULL,
  status       text          NOT NULL DEFAULT 'pending',
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  subtotal     numeric(10,2) NOT NULL DEFAULT 0.00,
  total        numeric(10,2) NOT NULL DEFAULT 0.00,
  tax          numeric(10,2) NOT NULL DEFAULT 0.00,
  order_number bigint        NOT NULL,
  updated_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT orders_tax_check CHECK (tax >= 0),
  CONSTRAINT orders_total_check CHECK (total >= 0)
);

CREATE TABLE public.order_products (
  id         uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_id   uuid          NOT NULL,
  product_id uuid          NOT NULL,
  quantity   smallint      NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_products_pkey PRIMARY KEY (id),
  CONSTRAINT order_products_order_product_unique UNIQUE (order_id, product_id),
  CONSTRAINT order_products_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_products_unit_price_check CHECK (unit_price >= 0)
);

CREATE TABLE public.order_kits (
  id         uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_id   uuid          NOT NULL,
  kit_id     uuid          NOT NULL,
  quantity   smallint      NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_kits_pkey PRIMARY KEY (id),
  CONSTRAINT order_kits_order_kit_unique UNIQUE (order_id, kit_id),
  CONSTRAINT order_kits_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_kits_unit_price_check CHECK (unit_price >= 0)
);

CREATE TABLE public.order_combos (
  id         uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_id   uuid          NOT NULL,
  combo_id   uuid          NOT NULL,
  quantity   smallint      NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_combos_pkey PRIMARY KEY (id),
  CONSTRAINT order_combos_order_combo_unique UNIQUE (order_id, combo_id),
  CONSTRAINT order_combos_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_combos_unit_price_check CHECK (unit_price >= 0)
);


-- ---------------------------------------------------------------------
-- 6. Foreign keys
--    CASCADE where child rows have no meaning without the parent
--    (images, prices, bundle lines); RESTRICT where history must be kept
--    (a product or kit that appears on an order cannot be deleted).
-- ---------------------------------------------------------------------

ALTER TABLE public.products ADD CONSTRAINT products_brand_id_fkey        FOREIGN KEY (brand_id)        REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD CONSTRAINT products_condition_id_fkey    FOREIGN KEY (condition_id)    REFERENCES public.conditions(id);
ALTER TABLE public.products ADD CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id);

ALTER TABLE public.prices         ADD CONSTRAINT prices_product_id_fkey         FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.discounts      ADD CONSTRAINT discounts_product_id_fkey      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_id_fkey         FOREIGN KEY (product_id)         REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_warehouse_location_fkey FOREIGN KEY (warehouse_location) REFERENCES public.warehouse(id);

ALTER TABLE public.kits      ADD CONSTRAINT kits_brand_id_fkey          FOREIGN KEY (brand_id)        REFERENCES public.brands(id);
ALTER TABLE public.kits      ADD CONSTRAINT kits_product_type_id_fkey   FOREIGN KEY (product_type_id) REFERENCES public.product_types(id);
ALTER TABLE public.kit_items ADD CONSTRAINT kit_items_kit_id_fkey       FOREIGN KEY (kit_id)          REFERENCES public.kits(id)     ON DELETE CASCADE;
ALTER TABLE public.kit_items ADD CONSTRAINT kit_items_product_id_fkey   FOREIGN KEY (product_id)      REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.combos      ADD CONSTRAINT combos_brand_id_fkey          FOREIGN KEY (brand_id)   REFERENCES public.brands(id);
ALTER TABLE public.combo_items ADD CONSTRAINT combo_items_combo_id_fkey     FOREIGN KEY (combo_id)   REFERENCES public.combos(id)     ON DELETE CASCADE;
ALTER TABLE public.combo_items ADD CONSTRAINT combo_items_product_id_fkey   FOREIGN KEY (product_id) REFERENCES public.products(id)   ON DELETE CASCADE;
ALTER TABLE public.combo_items ADD CONSTRAINT combo_items_condition_fkey    FOREIGN KEY (condition)  REFERENCES public.conditions(id);

ALTER TABLE public.orders         ADD CONSTRAINT orders_customer_id_fkey        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE public.order_products ADD CONSTRAINT order_products_order_id_fkey   FOREIGN KEY (order_id)    REFERENCES public.orders(id)    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.order_products ADD CONSTRAINT order_products_product_id_fkey FOREIGN KEY (product_id)  REFERENCES public.products(id)  ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE public.order_kits     ADD CONSTRAINT order_kits_order_id_fkey       FOREIGN KEY (order_id)    REFERENCES public.orders(id)    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.order_kits     ADD CONSTRAINT order_kits_kit_id_fkey         FOREIGN KEY (kit_id)      REFERENCES public.kits(id)      ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE public.order_combos   ADD CONSTRAINT order_combos_order_id_fkey     FOREIGN KEY (order_id)    REFERENCES public.orders(id)    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.order_combos   ADD CONSTRAINT order_combos_combo_id_fkey     FOREIGN KEY (combo_id)    REFERENCES public.combos(id)    ON UPDATE CASCADE ON DELETE RESTRICT;
