import React, { useState, useEffect } from 'react';
import { backendStore, realtimeBus, formatKES } from '../lib/supabase';
import { Order, OrderStatus } from '../types/database';
import { ChefHat, Clock, AlertTriangle, CheckCircle, Volume2, VolumeX, RefreshCw } from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const outlets = backendStore.getOutlets();

  const loadKitchenOrders = () => {
    // Kitchen focuses on active preparation: received and preparing
    const all = backendStore.getOrders();
    const active = all.filter(
      (o) => (o.status === 'received' || o.status === 'preparing') && 
             (selectedOutlet === 'all' || o.outlet_id === selectedOutlet)
    );
    setOrders(active);
  };

  useEffect(() => {
    // Authenticate kitchen staff session
    try {
      backendStore.loginStaff('kitchen@crownhotels.co.ke', 'kitchen');
    } catch {
      // already logged in
    }

    loadKitchenOrders();

    const off1 = realtimeBus.on('order:new', (newOrder: Order) => {
      loadKitchenOrders();
      if (soundEnabled) {
        playKitchenChime();
      }
    });

    const off2 = realtimeBus.on('order:status_changed', loadKitchenOrders);

    // Refresh timers every 10 seconds
    const interval = setInterval(() => {
      setOrders([...backendStore.getOrders().filter(
        (o) => (o.status === 'received' || o.status === 'preparing') && 
               (selectedOutlet === 'all' || o.outlet_id === selectedOutlet)
      )]);
    }, 10000);

    return () => {
      off1();
      off2();
      clearInterval(interval);
    };
  }, [selectedOutlet, soundEnabled]);

  const playKitchenChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio not allowed yet by user interaction');
    }
  };

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = currentStatus === 'received' ? 'preparing' : 'ready';
    try {
      backendStore.updateOrderStatus(orderId, nextStatus);
      loadKitchenOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helper to compute minutes elapsed
  const getElapsedMinutes = (isoString: string): number => {
    const created = new Date(isoString).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / 60000));
  };

  return (
    <div className="min-h-screen bg-[#071527] text-[#FAF6EC] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-[#C9A227]/30 bg-[#0B1F3A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-crown-gold/20 text-crown-gold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-crown-gold">
              CROWN KITCHEN DISPLAY (KDS)
            </h1>
            <p className="text-xs text-gray-400">Live Production Tickets · Africa/Nairobi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Outlet filter */}
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#071527] border border-[#C9A227]/30 text-xs font-semibold focus:border-crown-gold"
          >
            <option value="all">All Kitchen Outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playKitchenChime();
            }}
            className={`p-2 rounded-lg border transition ${
              soundEnabled ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' : 'border-stone-700 text-stone-500'
            }`}
            title="Toggle Chime Alert"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={loadKitchenOrders}
            className="p-2 rounded-lg border border-crown-gold/30 text-crown-gold hover:bg-crown-gold/10 transition"
            title="Manual Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="p-6 flex-1 overflow-x-auto">
        {orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-emerald-500 opacity-60" />
            <h2 className="font-serif text-2xl font-bold text-crown-gold">All Tickets Clear</h2>
            <p className="text-sm text-gray-400">Kitchen is ready. New orders from tables and rooms will chime immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {orders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);
              // Urgency timer colors: green < 10m, amber 10-20m, red > 20m
              const timerColor = elapsed > 20 ? 'bg-red-950 border-red-500 text-red-200' :
                                 elapsed > 10 ? 'bg-amber-950 border-amber-500 text-amber-200' :
                                 'bg-emerald-950 border-emerald-500 text-emerald-200';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col justify-between transition-all ${
                    order.status === 'received' ? 'border-blue-500/70 bg-[#0B1F3A]' : 'border-amber-500/70 bg-[#122238]'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-crown-gold">{order.order_ref}</span>
                      <h3 className="font-serif text-xl font-bold text-white leading-tight">
                        {order.service_point?.label || 'Table Order'}
                      </h3>
                      <p className="text-[11px] text-gray-400">{order.outlet?.name}</p>
                    </div>

                    {/* Prep Timer */}
                    <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-mono text-xs font-bold ${timerColor}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Ticket Items */}
                  <div className="p-4 divide-y divide-white/10 space-y-3 flex-1 text-sm">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="pt-2.5 first:pt-0 space-y-1">
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-base text-white">
                            <span className="text-crown-gold text-lg mr-1.5">{item.quantity}x</span>
                            {item.item_name_en}
                          </span>
                        </div>

                        {/* Modifiers (e.g. Medium Rare, Ugali side) */}
                        {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                          <div className="pl-6 space-y-0.5">
                            {item.selected_modifiers.map((mod, mIdx) => (
                              <p key={mIdx} className="text-xs text-crown-gold font-medium">
                                • {mod.name_en}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Special request note */}
                        {item.special_instructions && (
                          <div className="p-2 rounded bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Note: {item.special_instructions}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="p-4 border-t border-white/10 bg-black/20">
                    {order.status === 'received' ? (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'received')}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider transition shadow-lg"
                      >
                        Start Cooking →
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'preparing')}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider transition shadow-lg"
                      >
                        Ready to Serve ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
