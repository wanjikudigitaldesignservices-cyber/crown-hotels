import React, { useState, useEffect } from 'react';
import { backendStore, realtimeBus, formatKES } from '../lib/supabase';
import { Order } from '../types/database';
import { Bell, Check, Utensils, Receipt, CheckCircle, RefreshCw } from 'lucide-react';

interface StaffAlert {
  id: string;
  type: 'call_waiter' | 'request_bill';
  service_point: string;
  outlet: string;
  timestamp: string;
  message: string;
}

export const WaiterView: React.FC = () => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<StaffAlert[]>([]);

  const loadData = () => {
    const all = backendStore.getOrders();
    setReadyOrders(all.filter((o) => o.status === 'ready'));
  };

  useEffect(() => {
    try {
      backendStore.loginStaff('waiter@crownhotels.co.ke', 'waiter');
    } catch {
      // logged in
    }

    loadData();

    const off1 = realtimeBus.on('order:status_changed', loadData);
    const off2 = realtimeBus.on('staff:alert', (payload: any) => {
      const newAlert: StaffAlert = {
        id: `alert-${Date.now()}`,
        ...payload,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      off1();
      off2();
    };
  }, []);

  const handleMarkServed = (orderId: string) => {
    try {
      backendStore.updateOrderStatus(orderId, 'served');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] dark:bg-[#071527] text-[#1C1C1C] dark:text-[#FAF6EC] flex flex-col font-sans">
      <header className="border-b border-[#C9A227]/30 bg-white dark:bg-[#0B1F3A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-crown-navy text-crown-gold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold">
              CROWN FLOOR &amp; WAITER SERVICE
            </h1>
            <p className="text-xs text-gray-500">Table Assistance &amp; Ready Orders</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg border border-crown-gold/30 hover:bg-crown-gold/10 transition"
        >
          <RefreshCw className="w-4 h-4 text-crown-gold" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto w-full p-6 space-y-8 flex-1">
        {/* Guest Assistance Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-crown-terracotta flex items-center gap-2">
              <Bell className="w-5 h-5 animate-bounce" />
              <span>Table Requests ({alerts.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/70 shadow-lg flex items-start justify-between gap-3 animate-pulse"
                >
                  <div className="space-y-1">
                    <span className="font-serif text-lg font-bold text-crown-navy dark:text-crown-gold">
                      {alert.service_point}
                    </span>
                    <p className="text-xs font-semibold text-crown-terracotta">{alert.message}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(alert.timestamp).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ready to Serve Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold">
              Ready for Table Service ({readyOrders.length})
            </h2>
            <span className="text-xs text-gray-400">Dishes ready at the pass</span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0B1F3A]/40 border border-[#C9A227]/20 space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-60" />
              <h3 className="font-serif text-lg font-bold">No Dishes Waiting</h3>
              <p className="text-xs text-gray-500">When chef marks a dish ready, it will show up here instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0B1F3A]/80 border-2 border-emerald-500 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-crown-gold-dark dark:text-crown-gold">{order.order_ref}</span>
                        <h3 className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-ivory">
                          {order.service_point?.label}
                        </h3>
                        <p className="text-xs text-gray-500">{order.outlet?.name}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        READY
                      </span>
                    </div>

                    <div className="border-t border-b border-stone-100 dark:border-stone-800 py-3 space-y-2 text-xs">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between font-medium">
                          <span>
                            <strong>{item.quantity}x</strong> {item.item_name_en}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <p>Guest: {order.guest_name || 'In-House'}</p>
                      <p>Payment: {order.payment_method.toUpperCase()} ({order.payment_status})</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkServed(order.id)}
                    className="w-full py-3 rounded-xl bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-sm tracking-wide hover:opacity-90 transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Delivered to Table (Mark Served)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
