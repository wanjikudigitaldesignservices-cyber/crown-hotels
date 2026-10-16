import { describe, it, expect, beforeEach } from 'vitest';
import { backendStore, normaliseKenyanPhone, isValidKenyanPhone } from '../src/lib/supabase';
import { SEED_ITEMS, SEED_CATEGORIES } from '../src/lib/seed-data';

describe('Phase 1 — Backend & Zero Trust Security Verification', () => {
  beforeEach(() => {
    backendStore.logoutStaff();
  });

  describe('1.1 Schema & Seed Data Completeness', () => {
    it('seeds 1 property with 4 outlets', () => {
      const property = backendStore.getProperty();
      expect(property.name).toBe('Crown Plaza Nairobi');
      expect(property.timezone).toBe('Africa/Nairobi');
      expect(property.service_charge_pct).toBe(5.0);

      const outlets = backendStore.getOutlets();
      expect(outlets.length).toBe(4);
      const types = outlets.map((o) => o.type);
      expect(types).toContain('restaurant');
      expect(types).toContain('bar');
      expect(types).toContain('poolside');
      expect(types).toContain('room_service');
    });

    it('seeds all menu categories including Swahili Coastal Kitchen', () => {
      const categories = backendStore.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(14);
      const slugs = categories.map((c) => c.slug);
      expect(slugs).toContain('breakfast');
      expect(slugs).toContain('starters');
      expect(slugs).toContain('kenyan-classics');
      expect(slugs).toContain('swahili-coastal');
      expect(slugs).toContain('grill-mains');
      expect(slugs).toContain('indian');
      expect(slugs).toContain('pizza-burgers');
      expect(slugs).toContain('sides');
      expect(slugs).toContain('desserts');
      expect(slugs).toContain('soft-drinks-juices');
      expect(slugs).toContain('hot-beverages');
      expect(slugs).toContain('beers-ciders');
      expect(slugs).toContain('wines-spirits');
      expect(slugs).toContain('cocktails');
      expect(slugs).toContain('kids');
    });

    it('seeds all items with exact KES integer prices including Swahili dishes', () => {
      const items = backendStore.getItems();
      expect(items.length).toBeGreaterThanOrEqual(63);

      // Verify specific prices from the prompt
      const nyamaChoma = items.find((i) => i.name_en.includes('Nyama Choma'));
      expect(nyamaChoma).toBeDefined();
      expect(nyamaChoma?.price_kes).toBe(1800);

      const kenyanBreakfast = items.find((i) => i.name_en === 'Kenyan Breakfast');
      expect(kenyanBreakfast?.price_kes).toBe(1200);

      const beefSteak = items.find((i) => i.name_en === 'Beef Steak');
      expect(beefSteak?.price_kes).toBe(2400);

      const samosas = items.find((i) => i.name_en.includes('Beef Samosas'));
      expect(samosas?.price_kes).toBe(650);

      const samakiKupaka = items.find((i) => i.name_en.includes('Samaki wa Kupaka'));
      expect(samakiKupaka?.price_kes).toBe(1850);

      const biryani = items.find((i) => i.name_en.includes('Swahili Beef Biryani'));
      expect(biryani?.price_kes).toBe(1450);

      const tusker = items.find((i) => i.name_en === 'Tusker Lager');
      expect(tusker?.price_kes).toBe(400);

      const dawa = items.find((i) => i.name_en === 'Dawa');
      expect(dawa?.price_kes).toBe(800);

      const ugali = items.find((i) => i.name_en === 'Ugali');
      expect(ugali?.price_kes).toBe(200);
    });

    it('provides unguessable 128-bit QR tokens for service points', () => {
      const sps = backendStore.getServicePoints();
      expect(sps.length).toBeGreaterThanOrEqual(8);
      sps.forEach((sp) => {
        expect(sp.qr_token.length).toBeGreaterThan(20);
        expect(sp.qr_token).toMatch(/^crn_/);
      });
    });
  });

  describe('1.2 Zero Trust Security & RLS Policies', () => {
    it('allows anonymous guests to read public menu views', () => {
      const items = backendStore.getItems();
      expect(items.length).toBeGreaterThanOrEqual(63);
      const sp = backendStore.resolveServicePointByToken('crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc');
      expect(sp).not.toBeNull();
      expect(sp?.servicePoint.label).toBe('Table 1');
    });

    it('PROVES anonymous client CANNOT write directly to menu items (RLS blocked)', () => {
      expect(() => {
        backendStore.assertAnonymousWriteBlocked('menu_items');
      }).toThrow(/Row Level Security policy violated/);

      expect(() => {
        backendStore.createMenuItem({
          category_id: SEED_CATEGORIES[0].id,
          name_en: 'Hacker Dish',
          name_sw: 'Hacker Dish Swahili',
          description_en: 'Exploit test',
          description_sw: 'Exploit test',
          price_kes: 1,
          prep_minutes: 5,
          spice_level: 0,
          dietary_flags: { vegetarian: false, vegan: false, halal: false, gluten_free: false, dairy_free: false, nut_free: false },
          allergens: [],
          is_available: true,
          is_featured: false,
          is_chefs_pick: false,
          sort_order: 99,
          deleted_at: null,
        });
      }).toThrow(/Row Level Security policy violated/);
    });

    it('PROVES anonymous client CANNOT toggle item availability directly', () => {
      const item = backendStore.getItems()[0];
      expect(() => {
        backendStore.toggleItemAvailability(item.id);
      }).toThrow(/Row Level Security policy violated/);
    });

    it('PROVES anonymous client CANNOT view audit log', () => {
      expect(() => {
        backendStore.getAuditLogs();
      }).toThrow(/Row Level Security policy violated/);
    });

    it('enforces role-based permissions: kitchen can toggle availability, but cannot bulk change prices', () => {
      // Login as kitchen staff
      backendStore.loginStaff('kitchen@crownhotels.co.ke', 'kitchen');
      const item = backendStore.getItems()[0];
      const initialAvailability = item.is_available;

      // Kitchen CAN toggle availability
      const updated = backendStore.toggleItemAvailability(item.id);
      expect(updated.is_available).toBe(!initialAvailability);

      // Kitchen CANNOT bulk change prices
      expect(() => {
        backendStore.bulkUpdatePrices(item.category_id, 10);
      }).toThrow(/403 Forbidden: Role 'kitchen' is not authorized/);

      // Restore availability
      backendStore.toggleItemAvailability(item.id);
    });

    it('allows manager and owner full CRUD and records audit logs', () => {
      backendStore.loginStaff('manager@crownhotels.co.ke', 'manager');
      const initialLogCount = backendStore.getAuditLogs().length;

      const created = backendStore.createMenuItem({
        category_id: SEED_CATEGORIES[2].id, // Kenyan Classics
        name_en: 'Kuku Choma Special',
        name_sw: 'Kuku Choma Maalumu',
        description_en: 'Slow-smoked free-range local chicken',
        description_sw: 'Kuku wa kienyeji aliyechomwa kwa moshi wa miti',
        price_kes: 1600,
        prep_minutes: 25,
        spice_level: 1,
        dietary_flags: { vegetarian: false, vegan: false, halal: true, gluten_free: true, dairy_free: true, nut_free: true },
        allergens: [],
        is_available: true,
        is_featured: true,
        is_chefs_pick: true,
        sort_order: 10,
        deleted_at: null,
      });

      expect(created.id).toBeDefined();
      const logsAfter = backendStore.getAuditLogs();
      expect(logsAfter.length).toBe(initialLogCount + 1);
      expect(logsAfter[0].action).toBe('INSERT');
      expect(logsAfter[0].entity_name).toBe('menu_items');
      expect(logsAfter[0].entity_id).toBe(created.id);
    });
  });

  describe('1.3 Order Creation Edge Function & Phone Normalisation', () => {
    it('normalises Kenyan phone numbers correctly', () => {
      expect(normaliseKenyanPhone('0712345678')).toBe('+254712345678');
      expect(normaliseKenyanPhone('0112345678')).toBe('+254112345678');
      expect(normaliseKenyanPhone('+254722000000')).toBe('+254722000000');
      expect(normaliseKenyanPhone('254712345678')).toBe('+254712345678');
      expect(isValidKenyanPhone('0712345678')).toBe(true);
      expect(isValidKenyanPhone('0112345678')).toBe(true);
      expect(isValidKenyanPhone('0201234567')).toBe(false); // Landline not mobile
    });

    it('enforces privacy consent under Kenya Data Protection Act 2019', async () => {
      const validToken = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
      const item = backendStore.getItems()[0];

      await expect(
        backendStore.createOrderEdgeFunction({
          servicePointToken: validToken,
          items: [{ itemId: item.id, quantity: 1 }],
          guestPhone: '0712345678',
          paymentMethod: 'mpesa',
          idempotencyKey: 'idemp-privacy-fail',
          privacyConsent: false, // Consent missing!
        })
      ).rejects.toThrow(/Kenya Data Protection Act 2019 requires explicit consent/);
    });

    it('recomputes all prices server-side and prevents client price tampering', async () => {
      const validToken = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
      const nyamaChoma = backendStore.getItems().find((i) => i.name_en.includes('Nyama Choma'))!;

      const result = await backendStore.createOrderEdgeFunction({
        servicePointToken: validToken,
        items: [{ itemId: nyamaChoma.id, quantity: 2 }],
        guestName: 'Jane Doe',
        guestPhone: '0722123456',
        paymentMethod: 'mpesa',
        idempotencyKey: 'idemp-tamper-test-1',
        privacyConsent: true,
      });

      // Nyama Choma is 1,800 KES x 2 = 3,600 KES
      // Service charge = 5% of 3,600 = 180 KES
      // Total = 3,780 KES
      expect(result.order.subtotal_kes).toBe(3600);
      expect(result.order.service_charge_kes).toBe(180);
      expect(result.order.total_kes).toBe(3780);
      expect(result.order.order_ref).toMatch(/^CRN-\d{6}-\d{4}$/);
      expect(result.order.guest_phone).toBe('+254722123456');
    });

    it('enforces idempotency so double-tap does not create duplicate orders', async () => {
      const validToken = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
      const item = backendStore.getItems().find((i) => i.name_en.includes('Beef Samosas'))!;
      const key = 'idemp-double-tap-test';

      const firstCall = await backendStore.createOrderEdgeFunction({
        servicePointToken: validToken,
        items: [{ itemId: item.id, quantity: 1 }],
        paymentMethod: 'pay_at_table',
        idempotencyKey: key,
        privacyConsent: true,
      });

      const secondCall = await backendStore.createOrderEdgeFunction({
        servicePointToken: validToken,
        items: [{ itemId: item.id, quantity: 1 }],
        paymentMethod: 'pay_at_table',
        idempotencyKey: key,
        privacyConsent: true,
      });

      expect(firstCall.order.id).toBe(secondCall.order.id);
      expect(firstCall.order.order_ref).toBe(secondCall.order.order_ref);
    });

    it('rejects orders containing sold out items', async () => {
      backendStore.loginStaff('kitchen@crownhotels.co.ke', 'kitchen');
      const item = backendStore.getItems()[0];
      if (item.is_available) {
        backendStore.toggleItemAvailability(item.id);
      }
      backendStore.logoutStaff();

      const validToken = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';

      await expect(
        backendStore.createOrderEdgeFunction({
          servicePointToken: validToken,
          items: [{ itemId: item.id, quantity: 1 }],
          paymentMethod: 'pay_at_table',
          idempotencyKey: 'idemp-soldout-test',
          privacyConsent: true,
        })
      ).rejects.toThrow(/currently marked sold out/);

      // Restore
      backendStore.loginStaff('kitchen@crownhotels.co.ke', 'kitchen');
      backendStore.toggleItemAvailability(item.id);
    });
  });

  describe('1.4 IntaSend M-Pesa Webhook Security', () => {
    it('rejects forged webhook with invalid signature', async () => {
      await expect(
        backendStore.processIntaSendWebhook({
          invoice_id: 'INV-FAKE',
          state: 'COMPLETE',
          value: 1000,
          signature: 'invalid',
          nonce: '123456',
        })
      ).rejects.toThrow(/Invalid IntaSend HMAC-SHA256 signature/);
    });

    it('processes verified webhook, updates payment to paid, and provides M-Pesa receipt', async () => {
      const validToken = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
      const item = backendStore.getItems().find((i) => i.price_kes === 650)!;

      const { order, payment } = await backendStore.createOrderEdgeFunction({
        servicePointToken: validToken,
        items: [{ itemId: item.id, quantity: 1 }],
        guestPhone: '0712345678',
        paymentMethod: 'mpesa',
        idempotencyKey: 'idemp-webhook-test',
        privacyConsent: true,
      });

      expect(payment).toBeDefined();
      expect(payment?.status).toBe('pending');

      const webhookResponse = await backendStore.processIntaSendWebhook({
        invoice_id: payment!.intasend_invoice_id!,
        state: 'COMPLETE',
        mpesa_reference: 'QGK7294821',
        value: order.total_kes,
        signature: 'valid_hmac_sha256_mock_sig',
        nonce: 'nonce-84920',
      });

      expect(webhookResponse.status).toBe('SUCCESS');

      const updatedOrder = backendStore.getOrderById(order.id);
      expect(updatedOrder?.payment_status).toBe('paid');

      // Test replay webhook: should be handled idempotently
      const replayResponse = await backendStore.processIntaSendWebhook({
        invoice_id: payment!.intasend_invoice_id!,
        state: 'COMPLETE',
        mpesa_reference: 'QGK7294821',
        value: order.total_kes,
        signature: 'valid_hmac_sha256_mock_sig',
        nonce: 'nonce-84920',
      });

      expect(replayResponse.status).toBe('ALREADY_PROCESSED');
    });
  });
});
