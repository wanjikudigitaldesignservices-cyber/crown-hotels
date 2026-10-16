import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/database';
import { backendStore, realtimeBus, formatKES } from '../lib/supabase';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Utensils, 
  Receipt, 
  Smartphone, 
  Check, 
  ExternalLink 
} from 'lucide-react';

interface Props {
  orderId: string;
  onClose: () => void;
  lang: 'en' | 'sw';
}

export const OrderTracker: React.FC<Props> = ({ orderId, onClose, lang }) => {
  const [order, setOrder] = useState<Order | null>(backendStore.getOrderById(orderId));

  useEffect(() => {
    const refresh = () => {
      setOrder(backendStore.getOrderById(orderId));
    };

    const off1 = realtimeBus.on('order:status_changed', (payload) => {
      if (payload.order?.id === orderId) {
        setOrder({ ...payload.order });
      }
    });

    const off2 = realtimeBus.on('order:payment_updated', (payload) => {
      if (payload.order?.id === orderId) {
        setOrder({ ...payload.order });
      }
    });

    // Polling fallback
    const interval = setInterval(refresh, 4000);

    return () => {
      off1();
      off2();
      clearInterval(interval);
    };
  }, [orderId]);

  if (!order) return null;

  const steps: Array<{ status: OrderStatus; labelEn: string; labelSw: string; icon: any }> = [
    { status: 'received', labelEn: 'Order Received', labelSw: 'Agizo Limepokelewa', icon: Receipt },
    { status: 'preparing', labelEn: 'In the Kitchen', labelSw: 'Linapikwa Jikoni', icon: ChefHat },
    { status: 'ready', labelEn: 'Ready to Serve', labelSw: 'Tayari Kuhudumiwa', icon: Utensils },
    { status: 'served', labelEn: 'Served to You', labelSw: 'Umehudumiwa', icon: CheckCircle2 },
  ];

  const statusIndexMap: Record<OrderStatus, number> = {
    received: 0,
    preparing: 1,
    ready: 2,
    served: 3,
    cancelled: -1,
  };

  const currentIndex = statusIndexMap[order.status];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-[#0B1F3A] w-full max-w-lg rounded-3xl border border-[#C9A227]/30 shadow-2xl p-6 sm:p-8 space-y-6 text-[#1C1C1C] dark:text-[#FAF6EC] relative animate-in zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Order Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crown-gold/20 text-crown-gold-dark dark:text-crown-gold text-xs font-bold font-mono">
            {order.order_ref}
          </div>
          <h2 className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-gold">
            {lang === 'sw' ? 'Ufuatiliaji wa Agizo' : 'Live Order Tracker'}
          </h2>
          <p className="text-xs text-gray-500">
            {order.service_point?.label} · {order.outlet?.name}
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="py-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {steps.map((step, idx) => {
              const isCompleted = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              const Icon = step.icon;

              return (
                <div key={step.status} className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-crown-gold text-crown-navy font-bold shadow-crown-gold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    } ${isCurrent ? 'ring-4 ring-crown-gold/30 animate-pulse' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-semibold leading-tight ${isCurrent ? 'text-crown-gold font-bold' : 'text-gray-400'}`}>
                    {lang === 'sw' ? step.labelSw : step.labelEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-crown-gold h-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(10, ((currentIndex + 1) / 4) * 100))}%` }}
            />
          </div>
        </div>

        {/* M-Pesa Receipt Details if Paid */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Payment Status:</span>
            <span className="font-bold text-emerald-600 uppercase flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{order.payment_status}</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Method:</span>
            <span className="font-semibold uppercase">{order.payment_method.replace('_', ' ')}</span>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-crown-navy dark:text-crown-gold pt-1 border-t border-stone-200 dark:border-stone-800">
            <span>Total Amount:</span>
            <span>{formatKES(order.total_kes)}</span>
          </div>
        </div>

        {/* Ordered items brief */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dishes Being Prepared</h4>
          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2 flex justify-between">
                <span><strong>{item.quantity}x</strong> {item.item_name_en}</span>
                <span className="text-gray-500">{formatKES(item.total_price_kes)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-xs uppercase tracking-wider hover:opacity-90 transition"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
