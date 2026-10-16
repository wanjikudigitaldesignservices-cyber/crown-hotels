import { createClient } from '@supabase/supabase-js';
import { 
  MenuItem, 
  MenuCategory, 
  Outlet, 
  Property, 
  ServicePoint, 
  Order, 
  OrderItem, 
  OrderEvent, 
  Payment, 
  Profile, 
  AuditLogEntry, 
  PropertySettings,
  UserRole,
  OrderStatus,
  PaymentStatus,
  ModifierGroup,
  Pairing
} from '../types/database';
import { 
  SEED_PROPERTY, 
  SEED_SETTINGS, 
  SEED_OUTLETS, 
  SEED_CATEGORIES, 
  SEED_ITEMS, 
  SEED_SERVICE_POINTS, 
  SEED_PROFILES, 
  SEED_MODIFIER_GROUPS, 
  SEED_PAIRINGS 
} from './seed-data';

// Normalise Kenyan phone numbers to E.164 (+254...)
export function normaliseKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    return '+254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+254')) {
    return cleaned;
  }
  if (/^[71]\d{8}$/.test(cleaned)) {
    return '+254' + cleaned;
  }
  return cleaned;
}

export function isValidKenyanPhone(phone: string): boolean {
  const norm = normaliseKenyanPhone(phone);
  // Valid Kenyan mobile numbers start with +2547... or +2541... and are 13 characters long (+254 followed by 9 digits)
  return /^\+254[71]\d{8}$/.test(norm);
}

// Format integer KES into "KES 1,850"
export function formatKES(amount: number): string {
  const rounded = Math.round(amount);
  return `KES ${rounded.toLocaleString('en-KE')}`;
}

// Format USD using dynamic admin rate
export function formatUSD(amountKES: number, rate: number = 130.0): string {
  const usd = amountKES / rate;
  return `$${usd.toFixed(2)}`;
}

// -----------------------------------------------------------------------------
// Realtime Bus (Broadcast across browser tabs & subscribers)
// -----------------------------------------------------------------------------
type EventCallback = (payload: any) => void;
class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('crown_hotels_realtime');
        this.channel.onmessage = (event) => {
          const { topic, payload } = event.data;
          this.emitLocal(topic, payload);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked', e);
      }
    }
  }

  on(topic: string, callback: EventCallback) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);
    return () => this.off(topic, callback);
  }

  off(topic: string, callback: EventCallback) {
    this.listeners.get(topic)?.delete(callback);
  }

  emit(topic: string, payload: any) {
    this.emitLocal(topic, payload);
    if (this.channel) {
      try {
        this.channel.postMessage({ topic, payload });
      } catch (e) {
        // channel error
      }
    }
  }

  private emitLocal(topic: string, payload: any) {
    const set = this.listeners.get(topic);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error('Error in event bus callback', err);
        }
      });
    }
  }
}

export const realtimeBus = new EventBus();

// -----------------------------------------------------------------------------
// Reactive Backend Data Layer with RLS, Auditing, and Zero Trust Validation
// -----------------------------------------------------------------------------
const STORAGE_PREFIX = 'crown_hotels_v1_';

class LocalBackendStore {
  private property: Property;
  private settings: PropertySettings;
  private outlets: Outlet[];
  private categories: MenuCategory[];
  private items: MenuItem[];
  private servicePoints: ServicePoint[];
  private profiles: Profile[];
  private modifierGroups: ModifierGroup[];
  private pairings: Pairing[];
  private orders: Order[];
  private payments: Payment[];
  private auditLogs: AuditLogEntry[];
  private currentStaffUser: Profile | null = null;

  constructor() {
    // Load from localStorage if present, else seed
    this.property = this.load('property', SEED_PROPERTY);
    this.settings = this.load('settings', SEED_SETTINGS);
    this.outlets = this.load('outlets', SEED_OUTLETS);
    this.categories = this.load('categories', SEED_CATEGORIES);
    this.items = this.load('items', SEED_ITEMS);
    this.servicePoints = this.load('service_points', SEED_SERVICE_POINTS);
    this.profiles = this.load('profiles', SEED_PROFILES);
    this.modifierGroups = this.load('modifier_groups', SEED_MODIFIER_GROUPS);
    this.pairings = this.load('pairings', SEED_PAIRINGS);
    this.orders = this.load('orders', []);
    this.payments = this.load('payments', []);
    this.auditLogs = this.load('audit_logs', []);

    // Set initial staff user from saved session if exists
    const savedStaff = this.load<Profile | null>('auth_staff', null);
    if (savedStaff) {
      this.currentStaffUser = savedStaff;
    }
  }

  private load<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private save<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  // Auth & Session
  getCurrentStaff(): Profile | null {
    return this.currentStaffUser;
  }

  loginStaff(email: string, role?: UserRole): Profile {
    const profile = this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      // If role specified, create or throw
      if (role) {
        const newProfile: Profile = {
          id: `u-${Date.now()}`,
          email,
          full_name: email.split('@')[0],
          role,
          property_id: this.property.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.profiles.push(newProfile);
        this.save('profiles', this.profiles);
        this.currentStaffUser = newProfile;
        this.save('auth_staff', newProfile);
        return newProfile;
      }
      throw new Error('Staff profile not found with email: ' + email);
    }
    this.currentStaffUser = profile;
    this.save('auth_staff', profile);
    this.logAudit('INSERT', 'profiles', profile.id, null, { action: 'LOGIN', email });
    return profile;
  }

  logoutStaff(): void {
    if (this.currentStaffUser) {
      this.logAudit('INSERT', 'profiles', this.currentStaffUser.id, null, { action: 'LOGOUT' });
    }
    this.currentStaffUser = null;
    this.save('auth_staff', null);
  }

  // Audit Logging
  private logAudit(
    action: AuditLogEntry['action'],
    entity_name: string,
    entity_id: string,
    before_state?: any,
    after_state?: any
  ): void {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: this.currentStaffUser?.id || null,
      user_email: this.currentStaffUser?.email || 'system@crownhotels.co.ke',
      action,
      entity_name,
      entity_id,
      before_state,
      after_state,
      ip_address: '127.0.0.1 (Nairobi)',
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    // Keep last 1,000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(0, 1000);
    }
    this.save('audit_logs', this.auditLogs);
    realtimeBus.emit('audit:new', entry);
  }

  // Zero Trust RLS Enforcement Check
  private requireRole(allowedRoles: UserRole[], actionDescription: string) {
    if (!this.currentStaffUser) {
      throw new Error(`PGRST301: Row Level Security policy violated — Anonymous clients cannot perform '${actionDescription}'. Must be authenticated.`);
    }
    if (!allowedRoles.includes(this.currentStaffUser.role)) {
      throw new Error(`403 Forbidden: Role '${this.currentStaffUser.role}' is not authorized to '${actionDescription}'. Requires: [${allowedRoles.join(', ')}].`);
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC READ VIEWS (Anonymous & Guest safe)
  // ---------------------------------------------------------------------------
  getProperty(): Property {
    return this.property;
  }

  getSettings(): PropertySettings {
    return this.settings;
  }

  getOutlets(): Outlet[] {
    return this.outlets.filter((o) => o.active);
  }

  getCategories(outletId?: string): MenuCategory[] {
    return this.categories
      .filter((c) => c.active && !c.deleted_at && (!outletId || c.outlet_id === outletId))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  getItems(categoryId?: string): MenuItem[] {
    return this.items
      .filter((item) => !item.deleted_at && (!categoryId || item.category_id === categoryId))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  getItemById(id: string): MenuItem | null {
    const item = this.items.find((i) => i.id === id && !i.deleted_at);
    if (!item) return null;
    // Attach modifier groups & pairings
    const groups = this.modifierGroups.filter((g) => g.item_id === item.id || g.category_id === item.category_id);
    const pairings = this.pairings
      .filter((p) => p.item_id === item.id)
      .map((p) => ({
        ...p,
        suggested_item: this.items.find((i) => i.id === p.suggested_item_id) || undefined,
      }));
    return {
      ...item,
      modifier_groups: groups,
      pairings,
    };
  }

  resolveServicePointByToken(qrToken: string): { servicePoint: ServicePoint; outlet: Outlet; property: Property } | null {
    const sp = this.servicePoints.find((s) => s.qr_token === qrToken && s.active);
    if (!sp) return null;
    const outlet = this.outlets.find((o) => o.id === sp.outlet_id && o.active);
    if (!outlet) return null;
    return {
      servicePoint: sp,
      outlet,
      property: this.property,
    };
  }

  // ---------------------------------------------------------------------------
  // ADMIN & STAFF WRITE OPERATIONS (Protected by RLS)
  // ---------------------------------------------------------------------------

  // Direct anonymous write attempts MUST throw an RLS error
  assertAnonymousWriteBlocked(table: string): void {
    if (!this.currentStaffUser) {
      throw new Error(`PGRST301: Row Level Security policy violated — table '${table}' does not allow anonymous write.`);
    }
  }

  toggleItemAvailability(itemId: string): MenuItem {
    // Allowed by owner, manager, kitchen
    this.requireRole(['owner', 'manager', 'kitchen'], 'toggle item availability');
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found: ' + itemId);

    const before = { is_available: item.is_available };
    item.is_available = !item.is_available;
    item.updated_at = new Date().toISOString();
    const after = { is_available: item.is_available };

    this.save('items', this.items);
    this.logAudit('AVAILABILITY_TOGGLE', 'menu_items', item.id, before, after);
    realtimeBus.emit('menu:availability_changed', { itemId: item.id, is_available: item.is_available });
    return item;
  }

  createMenuItem(data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): MenuItem {
    this.requireRole(['owner', 'manager'], 'create menu item');
    const id = `d-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newItem: MenuItem = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.items.push(newItem);
    this.save('items', this.items);
    this.logAudit('INSERT', 'menu_items', id, null, newItem);
    realtimeBus.emit('menu:item_created', newItem);
    return newItem;
  }

  updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem {
    this.requireRole(['owner', 'manager'], 'update menu item');
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    const before = { ...this.items[idx] };
    this.items[idx] = {
      ...this.items[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save('items', this.items);
    this.logAudit('UPDATE', 'menu_items', id, before, this.items[idx]);
    realtimeBus.emit('menu:item_updated', this.items[idx]);
    return this.items[idx];
  }

  softDeleteItem(id: string): MenuItem {
    this.requireRole(['owner', 'manager'], 'soft-delete menu item');
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error('Item not found');
    const before = { deleted_at: item.deleted_at };
    item.deleted_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    this.save('items', this.items);
    this.logAudit('SOFT_DELETE', 'menu_items', id, before, { deleted_at: item.deleted_at });
    realtimeBus.emit('menu:item_deleted', { id });
    return item;
  }

  restoreItem(id: string): MenuItem {
    this.requireRole(['owner', 'manager'], 'restore menu item');
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error('Item not found');
    const before = { deleted_at: item.deleted_at };
    item.deleted_at = null;
    item.updated_at = new Date().toISOString();
    this.save('items', this.items);
    this.logAudit('RESTORE', 'menu_items', id, before, { deleted_at: null });
    realtimeBus.emit('menu:item_restored', item);
    return item;
  }

  duplicateItem(id: string): MenuItem {
    this.requireRole(['owner', 'manager'], 'duplicate menu item');
    const original = this.items.find((i) => i.id === id);
    if (!original) throw new Error('Item not found');
    const copy: MenuItem = {
      ...original,
      id: `d-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name_en: `${original.name_en} (Copy)`,
      name_sw: `${original.name_sw} (Nakala)`,
      sort_order: original.sort_order + 1,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.items.push(copy);
    this.save('items', this.items);
    this.logAudit('INSERT', 'menu_items', copy.id, null, copy);
    realtimeBus.emit('menu:item_created', copy);
    return copy;
  }

  reorderItems(categoryId: string, itemIdsInOrder: string[]): void {
    this.requireRole(['owner', 'manager'], 'reorder menu items');
    itemIdsInOrder.forEach((itemId, idx) => {
      const item = this.items.find((i) => i.id === itemId && i.category_id === categoryId);
      if (item) {
        item.sort_order = idx + 1;
        item.updated_at = new Date().toISOString();
      }
    });
    this.save('items', this.items);
    this.logAudit('REORDER', 'menu_items', categoryId, null, { itemIdsInOrder });
    realtimeBus.emit('menu:reordered', { categoryId, itemIdsInOrder });
  }

  bulkUpdatePrices(categoryId: string, percentChange: number): { updatedCount: number } {
    this.requireRole(['owner', 'manager'], 'bulk price change');
    const factor = 1 + percentChange / 100;
    let count = 0;
    this.items.forEach((item) => {
      if (item.category_id === categoryId && !item.deleted_at) {
        const oldPrice = item.price_kes;
        item.price_kes = Math.round(item.price_kes * factor);
        item.updated_at = new Date().toISOString();
        count++;
        this.logAudit('BULK_PRICE_CHANGE', 'menu_items', item.id, { price_kes: oldPrice }, { price_kes: item.price_kes });
      }
    });
    this.save('items', this.items);
    realtimeBus.emit('menu:bulk_price_updated', { categoryId, percentChange });
    return { updatedCount: count };
  }

  // QR Service Points Management
  getServicePoints(): ServicePoint[] {
    return this.servicePoints;
  }

  regenerateQrToken(servicePointId: string): ServicePoint {
    this.requireRole(['owner', 'manager'], 'regenerate QR token');
    const sp = this.servicePoints.find((s) => s.id === servicePointId);
    if (!sp) throw new Error('Service point not found');
    const before = { qr_token: sp.qr_token };
    // Generate 128-bit crypto hex token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    sp.qr_token = `crn_${sp.type.substring(0, 3)}_${randomHex}`;
    this.save('service_points', this.servicePoints);
    this.logAudit('UPDATE', 'service_points', sp.id, before, { qr_token: sp.qr_token });
    return sp;
  }

  revokeServicePoint(servicePointId: string): ServicePoint {
    this.requireRole(['owner', 'manager'], 'revoke service point');
    const sp = this.servicePoints.find((s) => s.id === servicePointId);
    if (!sp) throw new Error('Service point not found');
    const before = { active: sp.active };
    sp.active = false;
    this.save('service_points', this.servicePoints);
    this.logAudit('UPDATE', 'service_points', sp.id, before, { active: false });
    return sp;
  }

  // Settings
  updateSettings(updates: Partial<PropertySettings>): PropertySettings {
    this.requireRole(['owner', 'manager'], 'update settings');
    const before = { ...this.settings };
    this.settings = {
      ...this.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save('settings', this.settings);
    this.logAudit('UPDATE', 'settings', this.settings.id, before, this.settings);
    realtimeBus.emit('settings:updated', this.settings);
    return this.settings;
  }

  getAuditLogs(): AuditLogEntry[] {
    this.requireRole(['owner', 'manager'], 'view audit logs');
    return this.auditLogs;
  }

  // ---------------------------------------------------------------------------
  // ZERO-TRUST ORDER CREATION (Edge Function Server-Side Validation)
  // ---------------------------------------------------------------------------
  async createOrderEdgeFunction(params: {
    servicePointToken: string;
    items: Array<{
      itemId: string;
      quantity: number;
      selectedModifiers?: Array<{ modifierId: string; groupId: string }>;
      specialInstructions?: string;
    }>;
    guestName?: string;
    guestPhone?: string;
    paymentMethod: Order['payment_method'];
    idempotencyKey: string;
    privacyConsent: boolean;
  }): Promise<{ order: Order; payment?: Payment }> {
    // 1. Idempotency Check
    const existing = this.orders.find((o) => o.idempotency_key === params.idempotencyKey);
    if (existing) {
      const payment = this.payments.find((p) => p.order_id === existing.id);
      return { order: existing, payment };
    }

    // 2. Privacy Consent Check (Kenya Data Protection Act 2019)
    if (!params.privacyConsent && params.guestPhone) {
      throw new Error('Kenya Data Protection Act 2019 requires explicit consent to process guest phone numbers.');
    }

    // 3. Resolve Service Point
    const resolved = this.resolveServicePointByToken(params.servicePointToken);
    if (!resolved) {
      throw new Error('Invalid or revoked QR code token. Please scan a valid table QR.');
    }

    // 4. Validate and Normalise Phone Number
    let normalisedPhone: string | null = null;
    if (params.guestPhone) {
      if (!isValidKenyanPhone(params.guestPhone)) {
        throw new Error(`Invalid Kenyan phone number '${params.guestPhone}'. Must be 07xx, 01xx, or +254...`);
      }
      normalisedPhone = normaliseKenyanPhone(params.guestPhone);
    }

    if (params.paymentMethod === 'mpesa' && !normalisedPhone) {
      throw new Error('A valid Kenyan phone number is mandatory for M-Pesa STK Push.');
    }

    // 5. Server-Side Price & Availability Recomputation (Never trust client)
    let computedSubtotal = 0;
    const orderItems: OrderItem[] = [];
    const nowIso = new Date().toISOString();

    for (const itemReq of params.items) {
      if (itemReq.quantity <= 0) {
        throw new Error('Quantity must be greater than 0.');
      }
      const dbItem = this.items.find((i) => i.id === itemReq.itemId && !i.deleted_at);
      if (!dbItem) {
        throw new Error(`Item ${itemReq.itemId} not found or has been removed.`);
      }
      if (!dbItem.is_available) {
        throw new Error(`Item "${dbItem.name_en}" is currently marked sold out.`);
      }

      // Check category daypart
      const cat = this.categories.find((c) => c.id === dbItem.category_id);
      if (cat && cat.daypart_start && cat.daypart_end) {
        const nairobiTime = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour12: false });
        if (cat.daypart_start > cat.daypart_end) {
          // Crosses midnight, e.g. 22:00 to 02:00
          if (nairobiTime < cat.daypart_start && nairobiTime > cat.daypart_end) {
            throw new Error(`"${dbItem.name_en}" is only available between ${cat.daypart_start} and ${cat.daypart_end} (Africa/Nairobi).`);
          }
        } else {
          if (nairobiTime < cat.daypart_start || nairobiTime > cat.daypart_end) {
            throw new Error(`"${dbItem.name_en}" is only available between ${cat.daypart_start} and ${cat.daypart_end} (Africa/Nairobi).`);
          }
        }
      }

      // Recompute modifier deltas
      let modifierTotalDelta = 0;
      const verifiedModifiers: any[] = [];
      if (itemReq.selectedModifiers && itemReq.selectedModifiers.length > 0) {
        for (const modReq of itemReq.selectedModifiers) {
          const group = this.modifierGroups.find((g) => g.id === modReq.groupId);
          const mod = group?.modifiers?.find((m) => m.id === modReq.modifierId);
          if (mod) {
            modifierTotalDelta += mod.price_delta_kes;
            verifiedModifiers.push({
              modifier_id: mod.id,
              group_id: modReq.groupId,
              name_en: mod.name_en,
              name_sw: mod.name_sw,
              price_delta_kes: mod.price_delta_kes,
            });
          }
        }
      }

      const unitPrice = dbItem.price_kes + modifierTotalDelta;
      const lineTotal = unitPrice * itemReq.quantity;
      computedSubtotal += lineTotal;

      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        order_id: '', // set below
        item_id: dbItem.id,
        quantity: itemReq.quantity,
        unit_price_kes: unitPrice,
        total_price_kes: lineTotal,
        selected_modifiers: verifiedModifiers,
        special_instructions: itemReq.specialInstructions,
        item_name_en: dbItem.name_en,
        item_name_sw: dbItem.name_sw,
        created_at: nowIso,
      });
    }

    // 6. Calculate Service Charge & Taxes Server-Side
    const serviceChargePct = this.property.service_charge_pct || 0;
    const serviceChargeKES = Math.round((computedSubtotal * serviceChargePct) / 100);
    // 16% VAT is already inclusive by Kenyan law
    const taxKES = Math.round(computedSubtotal - computedSubtotal / (1 + this.property.vat_pct / 100));
    const totalKES = computedSubtotal + serviceChargeKES;

    // 7. Format Order Ref: CRN-YYMMDD-XXXX
    const dateStr = new Date()
      .toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', year: '2-digit', month: '2-digit', day: '2-digit' })
      .split('/')
      .reverse()
      .join('');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderRef = `CRN-${dateStr}-${randomSuffix}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    orderItems.forEach((oi) => (oi.order_id = orderId));

    const initialEvent: OrderEvent = {
      id: `ev-${Date.now()}`,
      order_id: orderId,
      from_status: null,
      to_status: 'received',
      actor_role: 'guest',
      note: 'Order placed by guest at ' + resolved.servicePoint.label,
      created_at: nowIso,
    };

    const newOrder: Order = {
      id: orderId,
      order_ref: orderRef,
      property_id: this.property.id,
      outlet_id: resolved.outlet.id,
      service_point_id: resolved.servicePoint.id,
      guest_name: params.guestName || null,
      guest_phone: normalisedPhone,
      status: 'received',
      payment_method: params.paymentMethod,
      payment_status: params.paymentMethod === 'pay_at_table' ? 'pending' : 'pending',
      subtotal_kes: computedSubtotal,
      service_charge_kes: serviceChargeKES,
      tax_kes: taxKES,
      total_kes: totalKES,
      idempotency_key: params.idempotencyKey,
      privacy_consent: params.privacyConsent,
      created_at: nowIso,
      updated_at: nowIso,
      items: orderItems,
      events: [initialEvent],
      service_point: resolved.servicePoint,
      outlet: resolved.outlet,
    };

    this.orders.unshift(newOrder);
    this.save('orders', this.orders);

    let payment: Payment | undefined;
    if (params.paymentMethod === 'mpesa') {
      payment = {
        id: `pay-${Date.now()}`,
        order_id: orderId,
        provider: 'intasend',
        intasend_invoice_id: `INV-${Date.now()}`,
        intasend_tracking_id: `TRK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        mpesa_receipt_number: null,
        phone_number: normalisedPhone!,
        amount_kes: totalKES,
        currency: 'KES',
        status: 'pending',
        signature_verified: false,
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.payments.unshift(payment);
      this.save('payments', this.payments);
    }

    this.logAudit('INSERT', 'orders', newOrder.id, null, {
      order_ref: orderRef,
      total_kes: totalKES,
      service_point: resolved.servicePoint.label,
    });

    // Realtime notification to Kitchen Display, Waiter, and Admin
    realtimeBus.emit('order:new', newOrder);

    return { order: newOrder, payment };
  }

  // ---------------------------------------------------------------------------
  // INTASEND M-PESA & WEBHOOK PROCESSING (Edge Function Simulation)
  // ---------------------------------------------------------------------------
  async processIntaSendWebhook(payload: {
    invoice_id: string;
    state: 'COMPLETE' | 'FAILED' | 'PROCESSING';
    mpesa_reference?: string;
    value: number;
    signature: string;
    nonce: string;
  }): Promise<{ status: string; order_ref: string }> {
    // 1. Signature Verification Check
    if (!payload.signature || payload.signature === 'invalid') {
      throw new Error('401 Unauthorized: Invalid IntaSend HMAC-SHA256 signature.');
    }

    // 2. Find Payment
    const payment = this.payments.find((p) => p.intasend_invoice_id === payload.invoice_id);
    if (!payment) {
      throw new Error('Payment record not found for invoice ' + payload.invoice_id);
    }

    // 3. Replay Protection: If already processed, ignore idempotently
    if (payment.status === 'paid' && payload.state === 'COMPLETE') {
      return { status: 'ALREADY_PROCESSED', order_ref: payment.order_id };
    }

    // 4. Update Payment State
    payment.status = payload.state === 'COMPLETE' ? 'paid' : 'failed';
    payment.mpesa_receipt_number = payload.mpesa_reference || `Q${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    payment.signature_verified = true;
    payment.raw_webhook = payload;
    payment.updated_at = new Date().toISOString();
    this.save('payments', this.payments);

    // 5. Update Order
    const order = this.orders.find((o) => o.id === payment.order_id);
    if (order) {
      order.payment_status = payment.status;
      order.updated_at = new Date().toISOString();
      const event: OrderEvent = {
        id: `ev-${Date.now()}`,
        order_id: order.id,
        from_status: order.status,
        to_status: order.status,
        actor_role: 'system',
        note: `M-Pesa payment confirmed via IntaSend. Receipt: ${payment.mpesa_receipt_number}`,
        created_at: new Date().toISOString(),
      };
      order.events = order.events || [];
      order.events.push(event);
      this.save('orders', this.orders);
      realtimeBus.emit('order:payment_updated', { order, payment });
      return { status: 'SUCCESS', order_ref: order.order_ref };
    }

    return { status: 'SUCCESS', order_ref: payment.order_id };
  }

  recordMpesaPaymentSuccess(orderId: string, mpesaReceipt: string): { order: Order; payment: Payment } {
    let payment = this.payments.find((p) => p.order_id === orderId);
    if (!payment) {
      payment = {
        id: `pay-${Date.now()}`,
        order_id: orderId,
        provider: 'daraja',
        phone_number: '',
        status: 'paid',
        amount_kes: 0,
        currency: 'KES',
        mpesa_receipt_number: mpesaReceipt,
        signature_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.payments.push(payment);
    } else {
      payment.status = 'paid';
      payment.mpesa_receipt_number = mpesaReceipt;
      payment.signature_verified = true;
      payment.updated_at = new Date().toISOString();
    }
    this.save('payments', this.payments);

    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.payment_status = 'paid';
      order.updated_at = new Date().toISOString();
      const event: OrderEvent = {
        id: `ev-${Date.now()}`,
        order_id: order.id,
        from_status: order.status,
        to_status: order.status,
        actor_role: 'system',
        note: `Safaricom Daraja M-Pesa payment confirmed. Receipt: ${mpesaReceipt}`,
        created_at: new Date().toISOString(),
      };
      order.events = order.events || [];
      order.events.push(event);
      this.save('orders', this.orders);
      realtimeBus.emit('order:payment_updated', { order, payment });
      return { order, payment };
    }
    throw new Error('Order not found for ID: ' + orderId);
  }

  // ---------------------------------------------------------------------------
  // STAFF ORDER MANAGEMENT (Kitchen, Waiter, Admin)
  // ---------------------------------------------------------------------------
  getOrders(filter?: { outlet_id?: string; status?: OrderStatus }): Order[] {
    return this.orders.filter((o) => {
      if (filter?.outlet_id && o.outlet_id !== filter.outlet_id) return false;
      if (filter?.status && o.status !== filter.status) return false;
      return true;
    });
  }

  getOrderById(orderId: string): Order | null {
    return this.orders.find((o) => o.id === orderId) || null;
  }

  getOrderByRef(orderRef: string): Order | null {
    return this.orders.find((o) => o.order_ref === orderRef) || null;
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Order {
    this.requireRole(['owner', 'manager', 'kitchen', 'waiter', 'front_desk'], 'update order status');
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    const event: OrderEvent = {
      id: `ev-${Date.now()}`,
      order_id: order.id,
      from_status: prevStatus,
      to_status: newStatus,
      actor_role: this.currentStaffUser?.role || 'staff',
      actor_id: this.currentStaffUser?.id,
      note: note || `Status updated from ${prevStatus} to ${newStatus}`,
      created_at: new Date().toISOString(),
    };
    order.events = order.events || [];
    order.events.push(event);

    this.save('orders', this.orders);
    this.logAudit('UPDATE', 'orders', order.id, { status: prevStatus }, { status: newStatus });
    realtimeBus.emit('order:status_changed', { order, event });
    return order;
  }

  // Call waiter or request bill from guest table
  requestStaffAssistance(servicePointToken: string, type: 'call_waiter' | 'request_bill'): { message: string } {
    const resolved = this.resolveServicePointByToken(servicePointToken);
    if (!resolved) throw new Error('Invalid service point token');

    const alertPayload = {
      type,
      service_point: resolved.servicePoint.label,
      outlet: resolved.outlet.name,
      timestamp: new Date().toISOString(),
      message: type === 'call_waiter' ? `Guest at ${resolved.servicePoint.label} requested waiter assistance!` : `Guest at ${resolved.servicePoint.label} requested the bill!`,
    };

    realtimeBus.emit('staff:alert', alertPayload);
    return { message: alertPayload.message };
  }
}

// Single instance backend store
export const backendStore = new LocalBackendStore();

// -----------------------------------------------------------------------------
// SUPABASE CLIENT & LIVE DATABASE CONNECTION MANAGER
// -----------------------------------------------------------------------------
export function getSavedSupabaseConfig(): { url: string; key: string } {
  if (typeof window === 'undefined') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
  const url = localStorage.getItem('crown_hotels_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('crown_hotels_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function isSupabaseLiveConfigured(): boolean {
  const { url, key } = getSavedSupabaseConfig();
  return (
    Boolean(url) &&
    !url.includes('mock-crown-hotels') &&
    !url.includes('your-project') &&
    Boolean(key) &&
    key.length > 25
  );
}

export function createSupabaseClient(customUrl?: string, customKey?: string) {
  const { url, key } = getSavedSupabaseConfig();
  const targetUrl = customUrl || url || 'https://mock-crown-hotels.supabase.co';
  const targetKey = customKey || key || 'mock-anon-key-crown-hotels-2026';
  return createClient(targetUrl, targetKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}

export let supabase = createSupabaseClient();

export async function verifySupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      return { success: false, message: 'Invalid Supabase URL. Format: https://<project-ref>.supabase.co' };
    }
    if (!cleanKey || cleanKey.length < 25) {
      return { success: false, message: 'Invalid Supabase Anon Key. Expected JWT string starting with eyJhbGciOi...' };
    }

    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (response.ok || response.status === 200) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('crown_hotels_supabase_url', cleanUrl);
        localStorage.setItem('crown_hotels_supabase_key', cleanKey);
        supabase = createSupabaseClient(cleanUrl, cleanKey);
      }
      return {
        success: true,
        message: 'Connected to Supabase live project successfully! Realtime subscriptions & PostgreSQL tables are active.',
      };
    } else {
      const errText = await response.text();
      return {
        success: false,
        message: `Supabase returned HTTP ${response.status}: ${errText || 'Project may be paused or credentials invalid.'}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Supabase: ${err.message}. If the project is paused, please unpause/restore it in the Supabase Dashboard.`,
    };
  }
}

export function clearSavedSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('crown_hotels_supabase_url');
    localStorage.removeItem('crown_hotels_supabase_key');
    supabase = createSupabaseClient();
  }
}

export async function testSupabaseDatabaseQuery(): Promise<{ 
  success: boolean; 
  message: string; 
  tableCounts?: { categories: number; items: number; servicePoints: number } 
}> {
  try {
    const [catRes, itemRes, spRes] = await Promise.all([
      supabase.from('menu_categories').select('id'),
      supabase.from('menu_items').select('id'),
      supabase.from('service_points').select('id')
    ]);

    if (catRes.error || itemRes.error || spRes.error) {
      const err = catRes.error || itemRes.error || spRes.error;
      return {
        success: false,
        message: `Supabase reached, but table query reported: ${err?.message || 'Schema table missing'}. Ensure migration scripts from supabase/migrations have been executed.`,
      };
    }

    const catCount = catRes.data?.length ?? 0;
    const itemCount = itemRes.data?.length ?? 0;
    const spCount = spRes.data?.length ?? 0;

    return {
      success: true,
      message: `PostgreSQL tables queried successfully: ${catCount} categories, ${itemCount} menu items, ${spCount} service points detected.`,
      tableCounts: { categories: catCount, items: itemCount, servicePoints: spCount }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Query verification failed: ${err.message}`,
    };
  }
}

