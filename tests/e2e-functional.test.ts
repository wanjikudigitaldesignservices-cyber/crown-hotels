import { describe, it, expect, beforeEach } from 'vitest';
import { backendStore, formatKES } from '../src/lib/supabase';
import { OrderStatus } from '../src/types/database';

describe('Crown Hotels — End-to-End Operational Lifecycle & QA Suite', () => {
  beforeEach(() => {
    backendStore.logoutStaff();
  });

  it('Flow 1: Guest scans Table 1 QR, browses menu, adds Nyama Choma with Ugali & Kachumbari, checks out with M-Pesa', async () => {
    // 1. Resolve QR token for Table 1
    const token = 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
    const ctx = backendStore.resolveServicePointByToken(token);
    expect(ctx).not.toBeNull();
    expect(ctx?.servicePoint.label).toBe('Table 1');
    expect(ctx?.outlet.name).toBe('The Sovereign Restaurant');

    // 2. Guest searches and selects Nyama Choma
    const items = backendStore.getItems();
    const nyamaChoma = items.find((i) => i.name_en.includes('Nyama Choma'))!;
    expect(nyamaChoma).toBeDefined();
    expect(nyamaChoma.price_kes).toBe(1800);

    // 3. Guest places order via Edge Function
    const idempotencyKey = `e2e-idemp-${Date.now()}`;
    const result = await backendStore.createOrderEdgeFunction({
      servicePointToken: token,
      items: [
        {
          itemId: nyamaChoma.id,
          quantity: 1,
          specialInstructions: 'Well charred on the edges please',
        },
      ],
      guestName: 'Kipchoge Keino',
      guestPhone: '0722001122',
      paymentMethod: 'mpesa',
      idempotencyKey,
      privacyConsent: true,
    });

    expect(result.order).toBeDefined();
    expect(result.order.order_ref).toMatch(/^CRN-\d{6}-\d{4}$/);
    expect(result.order.status).toBe('received');
    expect(result.order.subtotal_kes).toBe(1800);
    // 5% service charge = 90 KES -> Total = 1,890 KES
    expect(result.order.service_charge_kes).toBe(90);
    expect(result.order.total_kes).toBe(1890);

    // 4. M-Pesa payment record initialized with IntaSend invoice ID
    expect(result.payment).toBeDefined();
    expect(result.payment?.status).toBe('pending');
    expect(result.payment?.phone_number).toBe('+254722001122');

    // 5. IntaSend Webhook simulation hits backend with verified HMAC signature
    const webhookRes = await backendStore.processIntaSendWebhook({
      invoice_id: result.payment!.intasend_invoice_id!,
      state: 'COMPLETE',
      mpesa_reference: 'QGK9284710',
      value: 1890,
      signature: 'valid_signature_hash',
      nonce: 'nonce-e2e-1',
    });

    expect(webhookRes.status).toBe('SUCCESS');
    const orderAfterPay = backendStore.getOrderById(result.order.id);
    expect(orderAfterPay?.payment_status).toBe('paid');

    // 6. Kitchen sees the order on the ticket board and starts cooking
    backendStore.loginStaff('kitchen@crownhotels.co.ke', 'kitchen');
    const inPrep = backendStore.updateOrderStatus(result.order.id, 'preparing', 'Chef started grilling on open flame');
    expect(inPrep.status).toBe('preparing');

    // 7. Kitchen marks order ready
    const ready = backendStore.updateOrderStatus(result.order.id, 'ready', 'Plated on wooden board with hot ugali');
    expect(ready.status).toBe('ready');

    // 8. Waiter marks order delivered to table
    backendStore.loginStaff('waiter@crownhotels.co.ke', 'waiter');
    const served = backendStore.updateOrderStatus(result.order.id, 'served', 'Delivered to Table 1');
    expect(served.status).toBe('served');
  });

  it('Flow 2: Room Service Order with Room Charge (Testing daypart compliant breakfast/all-day items)', async () => {
    const roomToken = 'crn_rom_204e_9876543210abcdef0123456789ab';
    const ctx = backendStore.resolveServicePointByToken(roomToken);
    expect(ctx?.servicePoint.label).toContain('Room 204');

    // Order items valid for all-day dining (Swahili Beef Biryani 1,450 + Fresh Passion Juice 450)
    const biryani = backendStore.getItems().find((i) => i.name_en === 'Swahili Beef Biryani')!;
    const juice = backendStore.getItems().find((i) => i.name_en === 'Fresh Passion Juice')!;

    const result = await backendStore.createOrderEdgeFunction({
      servicePointToken: roomToken,
      items: [
        { itemId: biryani.id, quantity: 1, specialInstructions: 'Mild spice please' },
        { itemId: juice.id, quantity: 1 },
      ],
      guestName: 'Ambassador Patel',
      paymentMethod: 'room_charge',
      idempotencyKey: `room-charge-${Date.now()}`,
      privacyConsent: true,
    });

    // Swahili Beef Biryani 1,450 + Passion Juice 450 = 1,900 + 5% service charge (95) = 1,995 KES
    expect(result.order.subtotal_kes).toBe(1900);
    expect(result.order.service_charge_kes).toBe(95);
    expect(result.order.total_kes).toBe(1995);
    expect(result.order.payment_method).toBe('room_charge');
    expect(result.order.payment_status).toBe('pending');
  });

  it('Flow 3: Admin Menu Operations (Availability Toggle, Bulk Price, and Audit Log)', () => {
    backendStore.loginStaff('manager@crownhotels.co.ke', 'manager');
    const items = backendStore.getItems();
    const item = items[0];
    const initialAvailability = item.is_available;

    // Toggle Availability
    const updated = backendStore.toggleItemAvailability(item.id);
    expect(updated.is_available).toBe(!initialAvailability);

    // Bulk price update on Starters category
    const startersCat = backendStore.getCategories().find((c) => c.slug === 'starters')!;
    const bulkRes = backendStore.bulkUpdatePrices(startersCat.id, 10);
    expect(bulkRes.updatedCount).toBeGreaterThan(0);

    // Verify audit logs were written
    const logs = backendStore.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    const hasBulkLog = logs.some((l) => l.action === 'BULK_PRICE_CHANGE');
    expect(hasBulkLog).toBe(true);

    // Restore availability
    backendStore.toggleItemAvailability(item.id);
  });
});
