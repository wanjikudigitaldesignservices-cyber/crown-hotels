export type OutletType = 'restaurant' | 'bar' | 'room_service' | 'poolside' | 'cafe';
export type ServicePointType = 'table' | 'room' | 'poolside' | 'bar';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'pay_at_table' | 'room_charge';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type UserRole = 'owner' | 'manager' | 'kitchen' | 'waiter' | 'front_desk';
export type PromoType = 'percent' | 'fixed' | 'happy_hour' | 'combo';
export type PromoScope = 'item' | 'category' | 'outlet';

export interface Property {
  id: string;
  name: string;
  slug: string;
  town: string;
  address: string;
  phone: string;
  whatsapp?: string;
  timezone: string;
  service_charge_pct: number;
  vat_inclusive: boolean;
  vat_pct: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  property_id: string;
  name: string;
  type: OutletType;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  outlet_id: string;
  name_en: string;
  name_sw: string;
  slug: string;
  sort_order: number;
  daypart_start?: string | null;
  daypart_end?: string | null;
  is_alcohol: boolean;
  active: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietaryFlags {
  vegetarian: boolean;
  vegan: boolean;
  halal: boolean;
  gluten_free: boolean;
  dairy_free: boolean;
  nut_free: boolean;
}

export interface ItemImage {
  id: string;
  item_id: string;
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  width: number;
  height: number;
  variants: {
    '400w'?: string;
    '800w'?: string;
    '1200w'?: string;
  };
  created_at: string;
}

export interface ItemVariant {
  id: string;
  item_id: string;
  label_en: string;
  label_sw: string;
  price_delta_kes: number;
  created_at: string;
}

export interface Modifier {
  id: string;
  group_id: string;
  name_en: string;
  name_sw: string;
  price_delta_kes: number;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface ModifierGroup {
  id: string;
  item_id?: string | null;
  category_id?: string | null;
  name_en: string;
  name_sw: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  sort_order: number;
  modifiers?: Modifier[];
  created_at: string;
}

export interface Pairing {
  id: string;
  item_id: string;
  suggested_item_id: string;
  note_en?: string | null;
  note_sw?: string | null;
  sort_order: number;
  suggested_item?: MenuItem;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_sw: string;
  description_en: string;
  description_sw: string;
  price_kes: number;
  usd_override?: number | null;
  prep_minutes: number;
  spice_level: number; // 0 - 3
  dietary_flags: DietaryFlags;
  allergens: string[];
  calories?: number | null;
  is_available: boolean;
  is_featured: boolean;
  is_chefs_pick: boolean;
  sort_order: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  images?: ItemImage[];
  variants?: ItemVariant[];
  modifier_groups?: ModifierGroup[];
  pairings?: Pairing[];
}

export interface ServicePoint {
  id: string;
  outlet_id: string;
  type: ServicePointType;
  label: string;
  qr_token: string;
  active: boolean;
  created_at: string;
  outlet?: Outlet;
}

export interface SelectedModifier {
  modifier_id: string;
  group_id: string;
  name_en: string;
  name_sw: string;
  price_delta_kes: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price_kes: number;
  total_price_kes: number;
  selected_modifiers: SelectedModifier[];
  special_instructions?: string;
  item_name_en?: string;
  item_name_sw?: string;
  created_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  from_status?: OrderStatus | null;
  to_status: OrderStatus;
  actor_role: string;
  actor_id?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_ref: string;
  property_id: string;
  outlet_id: string;
  service_point_id: string;
  guest_name?: string | null;
  guest_phone?: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_kes: number;
  service_charge_kes: number;
  tax_kes: number;
  total_kes: number;
  special_instructions?: string | null;
  idempotency_key: string;
  privacy_consent: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  events?: OrderEvent[];
  service_point?: ServicePoint;
  outlet?: Outlet;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: 'intasend' | 'daraja' | 'mpesa';
  intasend_invoice_id?: string | null;
  intasend_tracking_id?: string | null;
  mpesa_receipt_number?: string | null;
  phone_number: string;
  amount_kes: number;
  currency: string;
  status: PaymentStatus;
  raw_webhook?: Record<string, unknown> | null;
  signature_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  property_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE' | 'AVAILABILITY_TOGGLE' | 'BULK_PRICE_CHANGE' | 'REORDER';
  entity_name: string;
  entity_id: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface PropertySettings {
  id: string;
  property_id: string;
  usd_exchange_rate: number;
  retention_days: number;
  allow_room_charge: boolean;
  allow_pay_at_table: boolean;
  auto_accept_orders: boolean;
  notification_phone?: string;
  support_email: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  property_id: string;
  name_en: string;
  name_sw: string;
  type: PromoType;
  scope: PromoScope;
  target_id?: string | null;
  discount_value: number;
  active_days: number[]; // 0 = Sun, 1 = Mon ...
  start_time?: string | null; // e.g. "17:00:00"
  end_time?: string | null;   // e.g. "20:00:00"
  active: boolean;
  created_at: string;
  updated_at: string;
}
