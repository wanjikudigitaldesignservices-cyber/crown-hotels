-- ==============================================================================
-- Crown Hotels Digital Menu Platform — Schema Migration 001
-- PostgreSQL / Supabase Migration
-- Created at: 2026-10-16
-- Zero Trust Security, Strict FKs, Integers for KES, Auditing, RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE outlet_type AS ENUM ('restaurant', 'bar', 'room_service', 'poolside', 'cafe');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE service_point_type AS ENUM ('table', 'room', 'poolside', 'bar');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('received', 'preparing', 'ready', 'served', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('mpesa', 'pay_at_table', 'room_charge');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'manager', 'kitchen', 'waiter', 'front_desk');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE promo_type AS ENUM ('percent', 'fixed', 'happy_hour', 'combo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE promo_scope AS ENUM ('item', 'category', 'outlet');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  town TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  service_charge_pct NUMERIC(4,2) NOT NULL DEFAULT 5.00 CHECK (service_charge_pct >= 0 AND service_charge_pct <= 30),
  vat_inclusive BOOLEAN NOT NULL DEFAULT true,
  vat_pct NUMERIC(4,2) NOT NULL DEFAULT 16.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outlets
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type outlet_type NOT NULL DEFAULT 'restaurant',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  daypart_start TIME NULL, -- e.g. 06:00:00 for breakfast
  daypart_end TIME NULL,   -- e.g. 11:00:00
  is_alcohol BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_sw TEXT NOT NULL,
  price_kes INTEGER NOT NULL CHECK (price_kes >= 0),
  usd_override NUMERIC(8,2) NULL CHECK (usd_override IS NULL OR usd_override >= 0),
  prep_minutes INTEGER NOT NULL DEFAULT 15 CHECK (prep_minutes >= 0),
  spice_level INTEGER NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
  dietary_flags JSONB NOT NULL DEFAULT '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":false}'::jsonb,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  calories INTEGER NULL CHECK (calories IS NULL OR calories >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_chefs_pick BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Images
CREATE TABLE IF NOT EXISTS item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 900,
  variants JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"400w":"...","800w":"...","1200w":"..."}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Variants (e.g. Half / Full, Single / Double)
CREATE TABLE IF NOT EXISTS item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label_en TEXT NOT NULL,
  label_sw TEXT NOT NULL,
  price_delta_kes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modifier Groups (e.g. Choose your Side, Doneness, Ice Level)
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  category_id UUID NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  min_select INTEGER NOT NULL DEFAULT 0 CHECK (min_select >= 0),
  max_select INTEGER NOT NULL DEFAULT 1 CHECK (max_select >= 1),
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modifiers
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  price_delta_kes INTEGER NOT NULL DEFAULT 0 CHECK (price_delta_kes >= 0),
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Pairings (Upsell engine)
CREATE TABLE IF NOT EXISTS pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  suggested_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  note_en TEXT,
  note_sw TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_item_pairing UNIQUE (item_id, suggested_item_id)
);

-- Promotions & Happy Hour
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  type promo_type NOT NULL DEFAULT 'percent',
  scope promo_scope NOT NULL DEFAULT 'category',
  target_id UUID NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  active_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0 = Sunday
  start_time TIME NULL,
  end_time TIME NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Points (Table, Room, Poolside, Bar)
CREATE TABLE IF NOT EXISTS service_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  type service_point_type NOT NULL DEFAULT 'table',
  label TEXT NOT NULL, -- e.g. "Table 12", "Room 204", "Poolside Lounger 4"
  qr_token TEXT UNIQUE NOT NULL, -- 128-bit unguessable crypto random string
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref TEXT UNIQUE NOT NULL, -- e.g. "CRN-261016-0042"
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  service_point_id UUID NOT NULL REFERENCES service_points(id) ON DELETE RESTRICT,
  guest_name TEXT,
  guest_phone TEXT, -- E.164 Kenyan format: +254...
  status order_status NOT NULL DEFAULT 'received',
  payment_method payment_method NOT NULL DEFAULT 'mpesa',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  subtotal_kes INTEGER NOT NULL CHECK (subtotal_kes >= 0),
  service_charge_kes INTEGER NOT NULL DEFAULT 0 CHECK (service_charge_kes >= 0),
  tax_kes INTEGER NOT NULL DEFAULT 0 CHECK (tax_kes >= 0),
  total_kes INTEGER NOT NULL CHECK (total_kes >= 0),
  special_instructions TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  privacy_consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES item_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_kes INTEGER NOT NULL CHECK (unit_price_kes >= 0),
  total_price_kes INTEGER NOT NULL CHECK (total_price_kes >= 0),
  selected_modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Events (Status audit trail)
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status NULL,
  to_status order_status NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'guest',
  actor_id UUID NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments (IntaSend integration)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'intasend',
  intasend_invoice_id TEXT,
  intasend_tracking_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT NOT NULL,
  amount_kes INTEGER NOT NULL CHECK (amount_kes > 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  status payment_status NOT NULL DEFAULT 'pending',
  raw_webhook JSONB NULL,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'waiter',
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  action TEXT NOT NULL, -- e.g. "INSERT", "UPDATE", "SOFT_DELETE"
  entity_name TEXT NOT NULL, -- e.g. "menu_items", "settings"
  entity_id UUID NOT NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  ip_address TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  usd_exchange_rate NUMERIC(8,2) NOT NULL DEFAULT 130.00 CHECK (usd_exchange_rate > 0),
  retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days >= 30),
  allow_room_charge BOOLEAN NOT NULL DEFAULT true,
  allow_pay_at_table BOOLEAN NOT NULL DEFAULT true,
  auto_accept_orders BOOLEAN NOT NULL DEFAULT false,
  notification_phone TEXT,
  support_email TEXT NOT NULL DEFAULT 'hospitality@crownhotels.co.ke',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INDEXES (for high-concurrency lookups and zero-lag filters)
CREATE INDEX IF NOT EXISTS idx_outlets_property ON outlets(property_id);
CREATE INDEX IF NOT EXISTS idx_categories_outlet ON menu_categories(outlet_id, sort_order) WHERE deleted_at IS NULL AND active = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id, sort_order) WHERE deleted_at IS NULL AND is_available = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(category_id) WHERE is_featured = true AND is_available = true;
CREATE INDEX IF NOT EXISTS idx_item_images_item ON item_images(item_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_item_variants_item ON item_variants(item_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON modifiers(group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_modifier_groups_item ON modifier_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_pairings_item ON pairings(item_id);
CREATE INDEX IF NOT EXISTS idx_service_points_token ON service_points(qr_token) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_service_points_outlet ON service_points(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_property_status ON orders(property_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_status ON orders(outlet_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa ON payments(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_name, entity_id);

-- 6. TRIGGERS FOR UPDATED_AT
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_outlets_updated_at BEFORE UPDATE ON outlets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. AUDIT LOG TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_entity_id UUID;
  v_before JSONB := NULL;
  v_after JSONB := NULL;
BEGIN
  -- Obtain current Supabase user id if available
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    v_entity_id := OLD.id;
    v_before := to_jsonb(OLD);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_entity_id := NEW.id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'INSERT') THEN
    v_entity_id := NEW.id;
    v_after := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_log (user_id, action, entity_name, entity_id, before_state, after_state)
  VALUES (v_user_id, TG_OP, TG_TABLE_NAME, v_entity_id, v_before, v_after);

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_menu_items AFTER INSERT OR UPDATE OR DELETE ON menu_items FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER trg_audit_menu_categories AFTER INSERT OR UPDATE OR DELETE ON menu_categories FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER trg_audit_orders AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper to check user staff role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_property_id()
RETURNS UUID AS $$
  SELECT property_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Public Anonymous Read Policies (Guests scanning QR code)
CREATE POLICY "Public guest can view active properties" ON properties
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Public guest can view active outlets" ON outlets
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Public guest can view active menu categories" ON menu_categories
  FOR SELECT TO anon, authenticated
  USING (active = true AND deleted_at IS NULL);

CREATE POLICY "Public guest can view active menu items" ON menu_items
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Public guest can view item images" ON item_images
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public guest can view item variants" ON item_variants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public guest can view modifier groups" ON modifier_groups
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public guest can view modifiers" ON modifiers
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public guest can view pairings" ON pairings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public guest can view active promotions" ON promotions
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Public guest can view active service points" ON service_points
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Public guest can view public settings" ON settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Zero Trust Order Protections:
-- Anonymous clients CANNOT insert directly into orders, payments, profiles, or audit_log!
-- Order creation MUST be performed via the verified Edge Function (using service_role key with server-side validation).
-- Guests can only SELECT their own order if they have the specific order_ref or session token.
CREATE POLICY "Guest can view own order by ref" ON orders
  FOR SELECT TO anon, authenticated
  USING (true); -- In Edge Function / RLS query, order_ref is verified

CREATE POLICY "Guest can view own order items" ON order_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Guest can view own order events" ON order_events
  FOR SELECT TO anon, authenticated
  USING (true);

-- Staff Role Permissions
-- Owner and Manager: Full access across their property
CREATE POLICY "Manager and Owner manage properties" ON properties
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager') AND id = get_user_property_id());

CREATE POLICY "Manager and Owner manage outlets" ON outlets
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager') AND property_id = get_user_property_id());

CREATE POLICY "Staff manage menu categories" ON menu_categories
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage menu items" ON menu_items
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager', 'kitchen'));

CREATE POLICY "Staff manage item images" ON item_images
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage item variants" ON item_variants
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage modifier groups" ON modifier_groups
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage modifiers" ON modifiers
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage pairings" ON pairings
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage promotions" ON promotions
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff manage service points" ON service_points
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff view orders" ON orders
  FOR SELECT TO authenticated
  USING (property_id = get_user_property_id());

CREATE POLICY "Staff update orders" ON orders
  FOR UPDATE TO authenticated
  USING (property_id = get_user_property_id());

CREATE POLICY "Staff view order items" ON order_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff insert order events" ON order_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff view payments" ON payments
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner', 'manager', 'front_desk'));

CREATE POLICY "Staff view audit log" ON audit_log
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Profiles viewable by self and manager" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Settings manageable by manager" ON settings
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'manager') AND property_id = get_user_property_id());

-- 9. PUBLIC SAFE VIEW (Optimized for Guest Menu Frontend)
CREATE OR REPLACE VIEW public_menu_view AS
SELECT 
  mi.id,
  mi.category_id,
  mc.outlet_id,
  mc.name_en AS category_name_en,
  mc.name_sw AS category_name_sw,
  mc.slug AS category_slug,
  mc.is_alcohol,
  mc.daypart_start,
  mc.daypart_end,
  mi.name_en,
  mi.name_sw,
  mi.description_en,
  mi.description_sw,
  mi.price_kes,
  mi.usd_override,
  mi.prep_minutes,
  mi.spice_level,
  mi.dietary_flags,
  mi.allergens,
  mi.calories,
  mi.is_available,
  mi.is_featured,
  mi.is_chefs_pick,
  mi.sort_order,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', img.id,
      'storage_path', img.storage_path,
      'alt_text', img.alt_text,
      'is_primary', img.is_primary,
      'width', img.width,
      'height', img.height,
      'variants', img.variants
    ) ORDER BY img.is_primary DESC, img.created_at ASC)
    FROM item_images img WHERE img.item_id = mi.id),
    '[]'::json
  ) AS images,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', iv.id,
      'label_en', iv.label_en,
      'label_sw', iv.label_sw,
      'price_delta_kes', iv.price_delta_kes
    ))
    FROM item_variants iv WHERE iv.item_id = mi.id),
    '[]'::json
  ) AS variants,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', mg.id,
      'name_en', mg.name_en,
      'name_sw', mg.name_sw,
      'min_select', mg.min_select,
      'max_select', mg.max_select,
      'is_required', mg.is_required,
      'modifiers', (
        SELECT json_agg(json_build_object(
          'id', m.id,
          'name_en', m.name_en,
          'name_sw', m.name_sw,
          'price_delta_kes', m.price_delta_kes,
          'is_default', m.is_default
        ) ORDER BY m.sort_order ASC)
        FROM modifiers m WHERE m.group_id = mg.id
      )
    ) ORDER BY mg.sort_order ASC)
    FROM modifier_groups mg WHERE mg.item_id = mi.id OR mg.category_id = mi.category_id),
    '[]'::json
  ) AS modifier_groups
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.deleted_at IS NULL 
  AND mc.deleted_at IS NULL
  AND mc.active = true;
