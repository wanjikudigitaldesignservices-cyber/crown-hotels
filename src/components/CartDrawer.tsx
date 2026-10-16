import React, { useState } from 'react';
import { MenuItem, SelectedModifier, Order, Payment } from '../types/database';
import { 
  backendStore, 
  formatKES, 
  formatUSD, 
  normaliseKenyanPhone, 
  isValidKenyanPhone 
} from '../lib/supabase';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Hotel, 
  Lock, 
  Check, 
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: 'KES' | 'USD';
  usdRate: number;
  lang: 'en' | 'sw';
  servicePointToken: string;
  servicePointLabel: string;
  outletName: string;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order, payment?: Payment) => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  usdRate,
  lang,
  servicePointToken,
  servicePointLabel,
  outletName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'pay_at_table' | 'room_charge'>('mpesa');
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STK Push Simulation state
  const [stkPendingOrder, setStkPendingOrder] = useState<{ order: Order; payment: Payment } | null>(null);
  const [stkSecondsLeft, setStkSecondsLeft] = useState(45);
  const [isStkProcessing, setIsStkProcessing] = useState(false);

  if (!isOpen) return null;

  // Compute Subtotal, 5% Service Charge, and Total
  let subtotalKES = 0;
  cartItems.forEach((ci) => {
    let modDelta = 0;
    ci.selectedModifiers.forEach((m) => (modDelta += m.price_delta_kes));
    subtotalKES += (ci.item.price_kes + modDelta) * ci.quantity;
  });

  const serviceChargeKES = Math.round((subtotalKES * 5) / 100);
  const totalKES = subtotalKES + serviceChargeKES;
  // 16% VAT is included in menu price by Kenyan law
  const taxPortionKES = Math.round(subtotalKES - subtotalKES / 1.16);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartItems.length === 0) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali chagua angalau chakula kimoja.' : 'Your cart is empty. Please select dishes to order.');
      return;
    }

    if (paymentMethod === 'mpesa' && !guestPhone.trim()) {
      setErrorMessage(lang === 'sw' ? 'Nambari ya simu inahitajika kwa malipo ya M-Pesa.' : 'A valid Kenyan phone number is required for M-Pesa STK Push.');
      return;
    }

    if (guestPhone.trim() && !isValidKenyanPhone(guestPhone)) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Nambari ya simu si sahihi. Tumia 07xx, 01xx au +254...' 
          : 'Invalid phone format. Please enter a valid Kenyan number (e.g. 0712 345 678, 0110 123 456).'
      );
      return;
    }

    if (!privacyConsent && guestPhone.trim()) {
      setErrorMessage(
        lang === 'sw'
          ? 'Tafadhali kubali usindikaji wa data kulingana na Sheria ya Data ya Kenya 2019.'
          : 'Please accept the privacy consent checkbox required by the Kenya Data Protection Act, 2019.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate idempotency key for double-tap safety
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

      const itemsPayload = cartItems.map((ci) => ({
        itemId: ci.item.id,
        quantity: ci.quantity,
        selectedModifiers: ci.selectedModifiers.map((m) => ({
          modifierId: m.modifier_id,
          groupId: m.group_id,
        })),
        specialInstructions: ci.specialInstructions,
      }));

      // Call Edge Function Order Creator
      const result = await backendStore.createOrderEdgeFunction({
        servicePointToken,
        items: itemsPayload,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        paymentMethod,
        idempotencyKey,
        privacyConsent,
      });

      if (paymentMethod === 'mpesa' && result.payment) {
        // Show "Check your phone" STK modal
        setStkPendingOrder({ order: result.order, payment: result.payment });
        setStkSecondsLeft(45);
        startStkCountdown(result.order, result.payment);
      } else {
        // Pay at table or room charge placed immediately
        onClearCart();
        onClose();
        onOrderSuccess(result.order, result.payment);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startStkCountdown = (order: Order, payment: Payment) => {
    let timeLeft = 45;
    const timer = setInterval(() => {
      timeLeft -= 1;
      setStkSecondsLeft(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  };

  // Simulate Guest entering M-Pesa PIN on phone for sandbox verification
  const handleSimulatePinEntered = async () => {
    if (!stkPendingOrder) return;
    setIsStkProcessing(true);

    try {
      // Simulate IntaSend webhook hitting backend with valid signature
      const webhookResponse = await backendStore.processIntaSendWebhook({
        invoice_id: stkPendingOrder.payment.intasend_invoice_id!,
        state: 'COMPLETE',
        mpesa_reference: `QGK${Math.floor(1000000 + Math.random() * 9000000)}`,
        value: stkPendingOrder.order.total_kes,
        signature: 'valid_intasend_hmac_sha256_sig',
        nonce: `nonce-${Date.now()}`,
      });

      const updatedOrder = backendStore.getOrderById(stkPendingOrder.order.id);
      setIsStkProcessing(false);
      setStkPendingOrder(null);
      onClearCart();
      onClose();
      onOrderSuccess(updatedOrder || stkPendingOrder.order, stkPendingOrder.payment);
    } catch (err: any) {
      alert('Webhook verification error: ' + err.message);
      setIsStkProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-[#0B1F3A] w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-[#C9A227]/20 flex items-center justify-between bg-stone-50 dark:bg-[#071527]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-crown-terracotta">
              {outletName}
            </span>
            <h2 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-gold flex items-center gap-2">
              <span>{lang === 'sw' ? 'Agizo Lako' : 'Your Order'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-crown-gold/20 text-crown-navy dark:text-crown-ivory font-mono">
                {servicePointLabel}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-gray-500">
              <p className="font-serif text-base font-bold text-crown-navy dark:text-crown-ivory">
                {lang === 'sw' ? 'Tafadhali chagua vyakula' : 'Your Order Is Empty'}
              </p>
              <p className="text-xs">Browse our visual menu and tap "Add to Order".</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 space-y-3">
              {cartItems.map((ci, idx) => {
                let modTotal = 0;
                ci.selectedModifiers.forEach((m) => (modTotal += m.price_delta_kes));
                const itemLineTotal = (ci.item.price_kes + modTotal) * ci.quantity;

                return (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-crown-navy dark:text-crown-ivory">
                          {lang === 'sw' ? ci.item.name_sw : ci.item.name_en}
                        </h4>
                        <span className="text-gray-400 text-[11px]">
                          {currency === 'KES' ? formatKES(ci.item.price_kes + modTotal) : formatUSD(ci.item.price_kes + modTotal, usdRate)} each
                        </span>
                      </div>
                      <span className="font-bold text-sm text-crown-navy dark:text-crown-gold whitespace-nowrap">
                        {currency === 'KES' ? formatKES(itemLineTotal) : formatUSD(itemLineTotal, usdRate)}
                      </span>
                    </div>

                    {/* Modifiers List */}
                    {ci.selectedModifiers.length > 0 && (
                      <div className="space-y-0.5 text-[11px] text-gray-500">
                        {ci.selectedModifiers.map((m, mIdx) => (
                          <p key={mIdx}>• {lang === 'sw' ? m.name_sw : m.name_en} {m.price_delta_kes > 0 && `(+${formatKES(m.price_delta_kes)})`}</p>
                        ))}
                      </div>
                    )}

                    {ci.specialInstructions && (
                      <p className="text-[11px] italic text-amber-600 dark:text-amber-400">
                        "{ci.specialInstructions}"
                      </p>
                    )}

                    {/* Stepper & Remove */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 p-0.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#071527]">
                        <button
                          onClick={() => onUpdateQuantity(idx, ci.quantity - 1)}
                          disabled={ci.quantity <= 1}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, ci.quantity + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-gray-400 hover:text-red-500 transition p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guest Checkout Inputs */}
          {cartItems.length > 0 && (
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="font-serif text-xs font-bold text-crown-navy dark:text-crown-gold uppercase tracking-wider">
                {lang === 'sw' ? 'Maelezo ya Mgeni' : 'Guest Information'}
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  {lang === 'sw' ? 'Jina Lako (Si lazima)' : 'Your Name (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Muthoni"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:border-crown-gold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  {lang === 'sw' ? 'Nambari ya Simu (M-Pesa)' : 'Phone Number (Required for M-Pesa)'}
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="0712 345 678 or 0110 123 456"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:border-crown-gold font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Accepts 07xx, 01xx, +254... (auto-normalised)</p>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] font-semibold text-gray-500">
                  {lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'mpesa'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 text-gray-500 hover:border-emerald-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px]">M-Pesa STK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_at_table')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'pay_at_table'
                        ? 'border-crown-gold bg-crown-gold/15 text-crown-navy dark:text-crown-gold font-bold shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 text-gray-500 hover:border-crown-gold'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-crown-gold" />
                    <span className="text-[11px]">Pay at Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('room_charge')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'room_charge'
                        ? 'border-crown-terracotta bg-crown-terracotta/15 text-crown-terracotta font-bold shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 text-gray-500 hover:border-crown-terracotta'
                    }`}
                  >
                    <Hotel className="w-4 h-4 text-crown-terracotta" />
                    <span className="text-[11px]">Room Charge</span>
                  </button>
                </div>
              </div>

              {/* Kenya Data Protection Act 2019 Consent */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 flex items-start gap-2.5 text-[11px] text-gray-500">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="rounded text-crown-gold mt-0.5 flex-shrink-0"
                />
                <label htmlFor="privacy-consent" className="cursor-pointer leading-tight">
                  I consent to the collection and processing of my phone number solely for order updates and receipt delivery in compliance with the <strong>Kenya Data Protection Act, 2019</strong>.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#071527] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{currency === 'KES' ? formatKES(subtotalKES) : formatUSD(subtotalKES, usdRate)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Hospitality Service Charge (5%)</span>
                <span>{currency === 'KES' ? formatKES(serviceChargeKES) : formatUSD(serviceChargeKES, usdRate)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 italic">
                <span>16% VAT (Inclusive)</span>
                <span>KES {taxPortionKES.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-serif text-base font-bold text-crown-navy dark:text-crown-gold pt-2 border-t border-stone-200 dark:border-stone-800">
                <span>Total Due</span>
                <span>{currency === 'KES' ? formatKES(totalKES) : formatUSD(totalKES, usdRate)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-sm tracking-wide hover:opacity-90 transition shadow-crown-gold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting Order...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'mpesa' 
                      ? `Pay via M-Pesa (${currency === 'KES' ? formatKES(totalKES) : formatUSD(totalKES, usdRate)})`
                      : 'Confirm & Place Order'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: M-PESA STK PUSH "CHECK YOUR PHONE" MODAL */}
      {/* --------------------------------------------------------------------- */}
      {stkPendingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1F3A] text-white rounded-3xl border-2 border-emerald-500 p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Smartphone className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-400">INTASEND M-PESA STK PUSH</span>
              <h3 className="font-serif text-2xl font-bold text-crown-gold">Check Your Phone</h3>
              <p className="text-xs text-gray-300">
                An STK Push prompt for <strong>{formatKES(stkPendingOrder.order.total_kes)}</strong> was sent to:
              </p>
              <p className="font-mono text-sm font-bold text-white pt-1">
                {stkPendingOrder.payment.phone_number}
              </p>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Prompt expires in {stkSecondsLeft}s</span>
            </div>

            {/* Sandbox PIN prompt trigger for seamless end-to-end testing */}
            <div className="p-4 rounded-2xl bg-[#071527] border border-white/10 space-y-2 text-left">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                IntaSend Sandbox Simulator
              </p>
              <p className="text-xs text-gray-300">
                In production, enter your M-Pesa PIN on your Safaricom SIM handset. In sandbox mode, tap below to simulate instant PIN approval:
              </p>
              <button
                onClick={handleSimulatePinEntered}
                disabled={isStkProcessing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isStkProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying IntaSend Webhook...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simulate M-Pesa PIN Authorized</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setStkPendingOrder(null)}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
