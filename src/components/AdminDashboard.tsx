import React, { useState, useEffect } from 'react';
import { 
  backendStore, 
  realtimeBus, 
  formatKES, 
  formatUSD,
  getSavedSupabaseConfig,
  isSupabaseLiveConfigured,
  verifySupabaseConnection,
  clearSavedSupabaseConfig,
  testSupabaseDatabaseQuery
} from '../lib/supabase';

import { 
  MenuItem, 
  MenuCategory, 
  Outlet, 
  ServicePoint, 
  Order, 
  AuditLogEntry, 
  PropertySettings,
  UserRole,
  OrderStatus
} from '../types/database';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  QrCode, 
  ClipboardList, 
  TrendingUp, 
  Settings as SettingsIcon, 
  History, 
  LogOut, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  DollarSign, 
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  ChefHat,
  BellRing,
  Database,
  Server,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';

type AdminTab = 'menu' | 'categories' | 'orders' | 'qr' | 'reports' | 'audit' | 'settings';

export const AdminDashboard: React.FC = () => {
  // Staff Auth State
  const [currentUser, setCurrentUser] = useState(backendStore.getCurrentStaff());
  const [loginEmail, setLoginEmail] = useState('manager@crownhotels.co.ke');
  const [loginRole, setLoginRole] = useState<UserRole>('manager');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

  // Data states
  const [categories, setCategories] = useState<MenuCategory[]>(backendStore.getCategories());
  const [items, setItems] = useState<MenuItem[]>(backendStore.getItems());
  const [outlets, setOutlets] = useState<Outlet[]>(backendStore.getOutlets());
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>(backendStore.getServicePoints());
  const [orders, setOrders] = useState<Order[]>(backendStore.getOrders());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<PropertySettings>(backendStore.getSettings());

  // Filter & Search states
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit / Modal states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [bulkPricePercent, setBulkPricePercent] = useState<number>(5);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [selectedTableTent, setSelectedTableTent] = useState<{ sp: ServicePoint; qrDataUrl: string } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Supabase Live Cloud state
  const savedSupabase = getSavedSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(savedSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(savedSupabase.key);
  const [isLiveConnected, setIsLiveConnected] = useState(isSupabaseLiveConfigured());
  const [isVerifyingSupabase, setIsVerifyingSupabase] = useState(false);
  const [isQueryingDb, setIsQueryingDb] = useState(false);
  const [supabaseVerifyResult, setSupabaseVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbQueryResult, setDbQueryResult] = useState<{ success: boolean; message: string; tableCounts?: { categories: number; items: number; servicePoints: number } } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);

  // Form State for Menu Item create/edit
  const [itemForm, setItemForm] = useState<{
    categoryId: string;
    nameEn: string;
    nameSw: string;
    descEn: string;
    descSw: string;
    priceKes: number;
    prepMinutes: number;
    spiceLevel: number;
    isFeatured: boolean;
    isChefsPick: boolean;
    isHalal: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
  }>({
    categoryId: categories[0]?.id || '',
    nameEn: '',
    nameSw: '',
    descEn: '',
    descSw: '',
    priceKes: 1000,
    prepMinutes: 15,
    spiceLevel: 0,
    isFeatured: false,
    isChefsPick: false,
    isHalal: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
  });

  const notify = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const refreshData = () => {
    setCategories(backendStore.getCategories());
    setItems(backendStore.getItems());
    setOutlets(backendStore.getOutlets());
    setServicePoints(backendStore.getServicePoints());
    setOrders(backendStore.getOrders());
    setSettings(backendStore.getSettings());
    if (currentUser && ['owner', 'manager'].includes(currentUser.role)) {
      try {
        setAuditLogs(backendStore.getAuditLogs());
      } catch (e) {
        // RLS blocked
      }
    }
  };

  const handleVerifySupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseVerifyResult({
        success: false,
        message: 'Please provide both the Supabase Project URL and Anon API Key.',
      });
      return;
    }

    setIsVerifyingSupabase(true);
    setSupabaseVerifyResult(null);
    setDbQueryResult(null);

    try {
      const res = await verifySupabaseConnection(supabaseUrl, supabaseKey);
      setSupabaseVerifyResult(res);
      if (res.success) {
        setIsLiveConnected(true);
        notify('Connected to live Supabase project!');
        // Automatically test table queries
        const queryRes = await testSupabaseDatabaseQuery();
        setDbQueryResult(queryRes);
      }
    } catch (err: any) {
      setSupabaseVerifyResult({
        success: false,
        message: err.message || 'Unknown network error when connecting to Supabase.',
      });
    } finally {
      setIsVerifyingSupabase(false);
    }
  };

  const handleTestDatabaseQuery = async () => {
    setIsQueryingDb(true);
    setDbQueryResult(null);
    try {
      const res = await testSupabaseDatabaseQuery();
      setDbQueryResult(res);
      if (res.success) {
        notify('Live PostgreSQL tables verified!');
      }
    } catch (err: any) {
      setDbQueryResult({
        success: false,
        message: err.message || 'Database query error.',
      });
    } finally {
      setIsQueryingDb(false);
    }
  };

  const handleDisconnectSupabase = () => {
    if (!confirm('Revert to local demo database? Cloud credentials will be cleared from this browser session.')) return;
    clearSavedSupabaseConfig();
    setIsLiveConnected(false);
    setSupabaseUrl('');
    setSupabaseKey('');
    setSupabaseVerifyResult(null);
    setDbQueryResult(null);
    notify('Reverted to high-performance local store (demo mode).');
  };

  const handleCopySqlInstructions = () => {
    navigator.clipboard.writeText('supabase/migrations/20261016_001_initial_schema.sql');
    setCopiedMigrationSql(true);
    setTimeout(() => setCopiedMigrationSql(false), 2500);
    notify('Copied migration file path to clipboard');
  };

  useEffect(() => {
    refreshData();

    // Listen to realtime updates
    const off1 = realtimeBus.on('menu:availability_changed', refreshData);
    const off2 = realtimeBus.on('order:new', refreshData);
    const off3 = realtimeBus.on('order:status_changed', refreshData);
    const off4 = realtimeBus.on('audit:new', refreshData);

    return () => {
      off1();
      off2();
      off3();
      off4();
    };
  }, [currentUser]);

  // Auth actions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const profile = backendStore.loginStaff(loginEmail, loginRole);
      setCurrentUser(profile);
      notify(`Welcome back, ${profile.full_name} (${profile.role.toUpperCase()})`);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    backendStore.logoutStaff();
    setCurrentUser(null);
  };

  // Availability Toggle
  const handleToggleAvailability = (itemId: string) => {
    try {
      const updated = backendStore.toggleItemAvailability(itemId);
      notify(`Availability for "${updated.name_en}" set to ${updated.is_available ? 'AVAILABLE' : 'SOLD OUT'}`);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Duplicate Item
  const handleDuplicate = (itemId: string) => {
    try {
      const copy = backendStore.duplicateItem(itemId);
      notify(`Created duplicate: "${copy.name_en}"`);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Soft Delete Item
  const handleDelete = (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the active menu?')) return;
    try {
      backendStore.softDeleteItem(itemId);
      notify('Item moved to trash');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Item
  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreatingItem(false);
    setItemForm({
      categoryId: item.category_id,
      nameEn: item.name_en,
      nameSw: item.name_sw,
      descEn: item.description_en,
      descSw: item.description_sw,
      priceKes: item.price_kes,
      prepMinutes: item.prep_minutes,
      spiceLevel: item.spice_level,
      isFeatured: item.is_featured,
      isChefsPick: item.is_chefs_pick,
      isHalal: item.dietary_flags.halal,
      isVegetarian: item.dietary_flags.vegetarian,
      isVegan: item.dietary_flags.vegan,
      isGlutenFree: item.dietary_flags.gluten_free,
    });
  };

  // Open Create Item
  const handleStartCreate = () => {
    setIsCreatingItem(true);
    setEditingItem(null);
    setItemForm({
      categoryId: categories[0]?.id || '',
      nameEn: '',
      nameSw: '',
      descEn: '',
      descSw: '',
      priceKes: 1000,
      prepMinutes: 15,
      spiceLevel: 0,
      isFeatured: false,
      isChefsPick: false,
      isHalal: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    });
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dietary = {
        vegetarian: itemForm.isVegetarian,
        vegan: itemForm.isVegan,
        halal: itemForm.isHalal,
        gluten_free: itemForm.isGlutenFree,
        dairy_free: false,
        nut_free: true,
      };

      if (editingItem) {
        backendStore.updateMenuItem(editingItem.id, {
          category_id: itemForm.categoryId,
          name_en: itemForm.nameEn,
          name_sw: itemForm.nameSw,
          description_en: itemForm.descEn,
          description_sw: itemForm.descSw,
          price_kes: Number(itemForm.priceKes),
          prep_minutes: Number(itemForm.prepMinutes),
          spice_level: Number(itemForm.spiceLevel),
          is_featured: itemForm.isFeatured,
          is_chefs_pick: itemForm.isChefsPick,
          dietary_flags: dietary,
        });
        notify(`Updated "${itemForm.nameEn}" successfully`);
      } else {
        const slug = itemForm.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        backendStore.createMenuItem({
          category_id: itemForm.categoryId,
          name_en: itemForm.nameEn,
          name_sw: itemForm.nameSw,
          description_en: itemForm.descEn,
          description_sw: itemForm.descSw,
          price_kes: Number(itemForm.priceKes),
          usd_override: null,
          prep_minutes: Number(itemForm.prepMinutes),
          spice_level: Number(itemForm.spiceLevel),
          dietary_flags: dietary,
          allergens: [],
          calories: null,
          is_available: true,
          is_featured: itemForm.isFeatured,
          is_chefs_pick: itemForm.isChefsPick,
          sort_order: items.length + 1,
          deleted_at: null,
          images: [
            {
              id: `img-${Date.now()}`,
              item_id: '',
              storage_path: `/images/menu/${slug}.webp`,
              alt_text: itemForm.nameEn,
              is_primary: true,
              width: 1200,
              height: 900,
              variants: {
                '400w': `/images/menu/variants/${slug}-400w.webp`,
                '800w': `/images/menu/variants/${slug}-800w.webp`,
                '1200w': `/images/menu/${slug}.webp`,
              },
              created_at: new Date().toISOString(),
            },
          ],
        });
        notify(`Created new dish "${itemForm.nameEn}"`);
      }
      setEditingItem(null);
      setIsCreatingItem(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bulk Price Update
  const handleApplyBulkPrice = () => {
    if (selectedCategory === 'all') {
      alert('Please select a specific category for bulk price modification.');
      return;
    }
    try {
      const res = backendStore.bulkUpdatePrices(selectedCategory, bulkPricePercent);
      notify(`Updated ${res.updatedCount} items by ${bulkPricePercent > 0 ? '+' : ''}${bulkPricePercent}%`);
      setShowBulkPriceModal(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // QR Code Generation for Table Tent
  const handleOpenTableTent = async (sp: ServicePoint) => {
    try {
      const guestUrl = `${window.location.origin}/m/${sp.qr_token}`;
      const dataUrl = await QRCode.toDataURL(guestUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0B1F3A',
          light: '#FAF6EC',
        },
      });
      setSelectedTableTent({ sp, qrDataUrl: dataUrl });
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  };

  // Regenerate QR Token
  const handleRegenerateToken = (spId: string) => {
    if (!confirm('Regenerating this QR token will immediately invalidate previous physical prints for this table. Proceed?')) return;
    try {
      const updated = backendStore.regenerateQrToken(spId);
      notify(`Regenerated 128-bit QR Token for ${updated.label}`);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    try {
      backendStore.updateOrderStatus(orderId, status);
      notify(`Order updated to ${status.toUpperCase()}`);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export CSV Menu
  const handleExportCSV = () => {
    const headers = ['Category', 'Name EN', 'Name SW', 'Price (KES)', 'Prep (Mins)', 'Spicy', 'Available', 'Featured', 'Chefs Pick'];
    const rows = items.map((i) => {
      const cat = categories.find((c) => c.id === i.category_id)?.name_en || 'Other';
      return [
        `"${cat}"`,
        `"${i.name_en}"`,
        `"${i.name_sw}"`,
        i.price_kes,
        i.prep_minutes,
        i.spice_level,
        i.is_available ? 'YES' : 'NO',
        i.is_featured ? 'YES' : 'NO',
        i.is_chefs_pick ? 'YES' : 'NO',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crown-hotels-menu-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Menu CSV exported successfully');
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
      const matchSw = item.name_sw.toLowerCase().includes(q) || item.description_sw.toLowerCase().includes(q);
      if (!matchEn && !matchSw) return false;
    }
    return true;
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (selectedOutlet !== 'all' && o.outlet_id !== selectedOutlet) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  // Calculate Reports
  const totalRevenueKES = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_method === 'pay_at_table')
    .reduce((sum, o) => sum + o.total_kes, 0);

  const mpesaOrders = orders.filter((o) => o.payment_method === 'mpesa').length;
  const tableOrders = orders.filter((o) => o.payment_method === 'pay_at_table').length;
  const roomOrders = orders.filter((o) => o.payment_method === 'room_charge').length;

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN (If not authenticated)
  // ---------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B1F3A] flex flex-col justify-center items-center p-6 text-white">
        <div className="max-w-md w-full bg-[#142C4E] border border-[#C9A227]/30 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <img src="/brand/crown-monogram.svg" alt="Crown Monogram" className="w-16 h-16 mx-auto shadow-crown-gold" />
            <h1 className="font-serif text-2xl font-bold tracking-wider text-crown-gold">CROWN HOTELS</h1>
            <p className="text-xs uppercase tracking-widest text-[#FAF6EC]/70 font-sans">Hospitality Management Portal</p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6EC]/80 mb-1">Staff Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#071527] border border-[#C9A227]/30 text-white focus:outline-none focus:border-crown-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6EC]/80 mb-1">Select Role</label>
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg bg-[#071527] border border-[#C9A227]/30 text-white focus:outline-none focus:border-crown-gold text-sm"
              >
                <option value="owner">Owner (Full Group Access)</option>
                <option value="manager">General Manager (Property Admin)</option>
                <option value="kitchen">Executive Kitchen (Prep &amp; 86)</option>
                <option value="waiter">Floor Waiter (Table Service)</option>
                <option value="front_desk">Front Desk (Room Charges)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-crown-gold text-crown-navy font-bold text-sm tracking-wide hover:bg-crown-gold-light transition shadow-crown-gold"
              >
                Sign In to Dashboard
              </button>
            </div>
          </form>

          {/* Quick Staff Switcher for pair testing */}
          <div className="pt-4 border-t border-[#C9A227]/20 text-center space-y-2">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Test Account Quick Select</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { setLoginEmail('manager@crownhotels.co.ke'); setLoginRole('manager'); }}
                className="px-2.5 py-1.5 rounded bg-[#0B1F3A] hover:bg-[#071527] border border-[#C9A227]/20 text-crown-gold"
              >
                GM (Manager)
              </button>
              <button
                onClick={() => { setLoginEmail('kitchen@crownhotels.co.ke'); setLoginRole('kitchen'); }}
                className="px-2.5 py-1.5 rounded bg-[#0B1F3A] hover:bg-[#071527] border border-[#C9A227]/20 text-crown-gold"
              >
                Head Chef (Kitchen)
              </button>
              <button
                onClick={() => { setLoginEmail('waiter@crownhotels.co.ke'); setLoginRole('waiter'); }}
                className="px-2.5 py-1.5 rounded bg-[#0B1F3A] hover:bg-[#071527] border border-[#C9A227]/20 text-crown-gold"
              >
                Floor Server (Waiter)
              </button>
              <button
                onClick={() => { setLoginEmail('frontdesk@crownhotels.co.ke'); setLoginRole('front_desk'); }}
                className="px-2.5 py-1.5 rounded bg-[#0B1F3A] hover:bg-[#071527] border border-[#C9A227]/20 text-crown-gold"
              >
                Duty Desk (Front Desk)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN ADMIN DASHBOARD UI
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF6EC] dark:bg-[#071527] text-[#1C1C1C] dark:text-[#FAF6EC] flex flex-col font-sans">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-crown-navy text-crown-gold border border-crown-gold/40 shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-[#C9A227]/20 bg-white/90 dark:bg-[#0B1F3A]/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/crown-monogram.svg" alt="Crown Logo" className="w-9 h-9 shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-crown-navy dark:text-crown-gold">CROWN HOTELS</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-crown-gold/20 text-crown-gold-dark dark:text-crown-gold">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Crown Plaza Nairobi · Upper Hill</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Database Status Indicator */}
            {isLiveConnected ? (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                title="Click to view Database settings"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Supabase Live Active</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                title="Click to configure live Supabase cloud database"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Local Demo Store</span>
                <span className="text-[10px] underline ml-0.5 font-bold">Connect DB</span>
              </button>
            )}

            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-crown-navy dark:text-crown-ivory">{currentUser.full_name}</p>
              <p className="text-[11px] text-gray-400">{currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-[#C9A227]/20 bg-white dark:bg-[#0B1F3A]/50 px-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex space-x-1">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
              activeTab === 'menu' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu Items ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
              activeTab === 'orders' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Orders Board ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
              activeTab === 'qr' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Manager &amp; Table Tents</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
              activeTab === 'reports' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Reports &amp; Sales</span>
          </button>

          {['owner', 'manager'].includes(currentUser.role) && (
            <>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
                  activeTab === 'audit' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Zero Trust Audit Log</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
                  activeTab === 'settings' ? 'border-crown-gold text-crown-gold' : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Property Settings</span>
              </button>
            </>
          )}

          {/* Direct link to Live Kitchen or Waiter display */}
          <a
            href="/kitchen"
            target="_blank"
            className="px-4 py-3 text-xs font-bold text-crown-terracotta hover:underline flex items-center gap-1.5 whitespace-nowrap"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Display KDS ↗</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">

        {/* ------------------------------------------------------------------- */}
        {/* TAB 1: MENU ITEMS MANAGER */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white dark:bg-[#0B1F3A]/60 p-4 rounded-2xl border border-[#C9A227]/20 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search dishes (English or Kiswahili)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en} ({c.name_sw})</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {['owner', 'manager'].includes(currentUser.role) && (
                  <>
                    <button
                      onClick={() => setShowBulkPriceModal(true)}
                      className="px-3.5 py-2 rounded-xl border border-crown-gold text-crown-gold text-xs font-semibold hover:bg-crown-gold/10 transition flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Bulk Price Change</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={handleStartCreate}
                      className="px-4 py-2 rounded-xl bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Menu Item</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white dark:bg-[#0B1F3A]/60 rounded-2xl border border-[#C9A227]/20 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C9A227]/20 bg-stone-50 dark:bg-[#071527]/70 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="p-3.5">Photo</th>
                      <th className="p-3.5">Item Name (EN / SW)</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (KES)</th>
                      <th className="p-3.5">Prep</th>
                      <th className="p-3.5">Badges</th>
                      <th className="p-3.5">Availability</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredItems.map((item) => {
                      const cat = categories.find((c) => c.id === item.category_id);
                      const primaryImg = item.images?.[0]?.storage_path || '/images/menu/dish.webp';

                      return (
                        <tr key={item.id} className="hover:bg-crown-gold/5 transition">
                          <td className="p-3.5">
                            <img
                              src={primaryImg}
                              alt={item.name_en}
                              className="w-12 h-9 object-cover rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm"
                            />
                          </td>
                          <td className="p-3.5 max-w-[240px]">
                            <p className="font-serif font-bold text-sm text-crown-navy dark:text-crown-ivory">{item.name_en}</p>
                            <p className="text-[11px] text-crown-terracotta italic">{item.name_sw}</p>
                          </td>
                          <td className="p-3.5 text-gray-500 whitespace-nowrap">
                            {cat?.name_en || 'General'}
                          </td>
                          <td className="p-3.5 font-bold font-sans text-crown-navy dark:text-crown-gold whitespace-nowrap">
                            {formatKES(item.price_kes)}
                          </td>
                          <td className="p-3.5 text-gray-500 whitespace-nowrap">
                            {item.prep_minutes} min
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {item.is_chefs_pick && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crown-gold/20 text-crown-gold-dark dark:text-crown-gold">Chef</span>
                              )}
                              {item.dietary_flags.vegetarian && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Veg</span>
                              )}
                              {item.spice_level > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">🌶️{item.spice_level}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleAvailability(item.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                                item.is_available
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-200'
                              }`}
                            >
                              {item.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{item.is_available ? 'Available' : 'Sold Out'}</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {['owner', 'manager'].includes(currentUser.role) && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="p-1.5 rounded-lg hover:bg-crown-gold/15 text-crown-navy dark:text-crown-gold transition"
                                    title="Edit Item"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(item.id)}
                                    className="p-1.5 rounded-lg hover:bg-crown-gold/15 text-gray-500 transition"
                                    title="Duplicate Item"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-500 transition"
                                    title="Soft Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 2: ORDERS BOARD */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0B1F3A]/60 p-4 rounded-2xl border border-[#C9A227]/20 shadow-sm">
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold"
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="received">Received</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready to Serve</option>
                  <option value="served">Served</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-semibold text-gray-500">
                Live Sync Enabled (Realtime Bus Active)
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#0B1F3A]/40 rounded-2xl border border-[#C9A227]/20 space-y-3">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto opacity-50" />
                <h3 className="font-serif text-lg font-bold">No active orders found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Orders placed by guests at tables, poolside, or room service will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => {
                  const statusColors: Record<OrderStatus, string> = {
                    received: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400',
                    preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400',
                    ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400',
                    served: 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300 border-stone-400',
                    cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400',
                  };

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-white dark:bg-[#0B1F3A]/70 border border-[#C9A227]/30 shadow-crown-card p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono font-bold text-sm text-crown-gold-dark dark:text-crown-gold">{order.order_ref}</span>
                            <h4 className="font-serif font-bold text-base text-crown-navy dark:text-crown-ivory">
                              {order.service_point?.label || 'Table Order'}
                            </h4>
                            <p className="text-[11px] text-gray-400">{order.outlet?.name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColors[order.status]}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Order Items List */}
                        <div className="border-t border-b border-stone-100 dark:border-stone-800 py-3 space-y-1.5 text-xs">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-200">
                                <strong>{item.quantity}x</strong> {item.item_name_en}
                              </span>
                              <span className="font-medium text-gray-500">{formatKES(item.total_price_kes)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Guest & Payment details */}
                        <div className="text-[11px] space-y-1 text-gray-500">
                          <p><strong>Guest:</strong> {order.guest_name || 'In-House Guest'}</p>
                          {order.guest_phone && <p><strong>Phone:</strong> {order.guest_phone}</p>}
                          <p>
                            <strong>Payment:</strong>{' '}
                            <span className="font-semibold uppercase text-crown-terracotta">
                              {order.payment_method.replace('_', ' ')}
                            </span>{' '}
                            ({order.payment_status})
                          </p>
                          <p className="text-xs font-bold text-crown-navy dark:text-crown-gold pt-1">
                            Total: {formatKES(order.total_kes)} (inc. 5% service charge &amp; 16% VAT)
                          </p>
                        </div>
                      </div>

                      {/* Status Transition Buttons */}
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5">
                        {order.status === 'received' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                          >
                            Mark Ready to Serve
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                            className="flex-1 py-1.5 rounded-lg bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-xs hover:opacity-90 transition"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 3: QR MANAGER & TABLE TENTS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0B1F3A]/60 p-6 rounded-2xl border border-[#C9A227]/20 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold">Service Points &amp; QR Table Tents</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Each table, poolside lounger, and hotel room is assigned a cryptographically unguessable 128-bit token. 
                  Regenerate anytime to invalidate stolen or outdated prints. Click "Print Table Tent" to preview printable A4 tent.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {servicePoints.map((sp) => {
                  const outlet = outlets.find((o) => o.id === sp.outlet_id);

                  return (
                    <div
                      key={sp.id}
                      className="p-5 rounded-2xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-crown-navy dark:text-crown-ivory">{sp.label}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-crown-gold/20 text-crown-gold-dark dark:text-crown-gold">
                            {sp.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{outlet?.name}</p>
                        <div className="p-2 rounded bg-stone-200 dark:bg-stone-900 font-mono text-[10px] text-gray-600 dark:text-gray-400 truncate">
                          {sp.qr_token}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenTableTent(sp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Tent</span>
                        </button>
                        {['owner', 'manager'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleRegenerateToken(sp.id)}
                            className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 text-xs text-gray-500 transition"
                            title="Regenerate 128-bit Token"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 4: REPORTS & ANALYTICS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/25 shadow-sm space-y-1">
                <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">Gross Sales (KES)</span>
                <p className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-gold">{formatKES(totalRevenueKES)}</p>
                <p className="text-[11px] text-emerald-600 font-medium">16% VAT &amp; 5% Service Chg Included</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/25 shadow-sm space-y-1">
                <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">Total Orders</span>
                <p className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-ivory">{orders.length}</p>
                <p className="text-[11px] text-gray-500">Across 4 hotel outlets</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/25 shadow-sm space-y-1">
                <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">M-Pesa STK Transactions</span>
                <p className="font-serif text-2xl font-bold text-crown-terracotta">{mpesaOrders}</p>
                <p className="text-[11px] text-gray-500">IntaSend payment gateway</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/25 shadow-sm space-y-1">
                <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">USD Equivalent</span>
                <p className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-gold">
                  {formatUSD(totalRevenueKES, settings.usd_exchange_rate)}
                </p>
                <p className="text-[11px] text-gray-500">Rate: 1 USD = KES {settings.usd_exchange_rate}</p>
              </div>
            </div>

            {/* Split breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 shadow-sm space-y-4">
                <h4 className="font-serif text-base font-bold text-crown-navy dark:text-crown-gold">Payment Method Distribution</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>M-Pesa STK Push (IntaSend)</span>
                      <span>{mpesaOrders} orders</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${orders.length ? (mpesaOrders / orders.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Pay at Table (Cash / Card Terminal)</span>
                      <span>{tableOrders} orders</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-crown-gold" style={{ width: `${orders.length ? (tableOrders / orders.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Charge to Room Folio</span>
                      <span>{roomOrders} orders</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-crown-terracotta" style={{ width: `${orders.length ? (roomOrders / orders.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 shadow-sm space-y-4">
                <h4 className="font-serif text-base font-bold text-crown-navy dark:text-crown-gold">Top Gastronomic Highlights</h4>
                <ul className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                  <li className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Nyama Choma ½kg</p>
                      <p className="text-[11px] text-gray-500">Kenyan Classics · Sovereign Restaurant</p>
                    </div>
                    <span className="font-bold text-crown-gold">KES 1,850</span>
                  </li>
                  <li className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Dawa Cocktail</p>
                      <p className="text-[11px] text-gray-500">Cocktails · Crown Safari Bar</p>
                    </div>
                    <span className="font-bold text-crown-gold">KES 800</span>
                  </li>
                  <li className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Whole Fried Tilapia &amp; Ugali</p>
                      <p className="text-[11px] text-gray-500">Lake Victoria Catch · Sovereign</p>
                    </div>
                    <span className="font-bold text-crown-gold">KES 1,750</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 5: AUDIT LOG VIEWER */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0B1F3A]/60 p-6 rounded-2xl border border-[#C9A227]/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold">Zero Trust Security Audit Trail</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Immutable log recording every administrative write, price adjustment, availability toggle, and login event.
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="Refresh Audit Trail"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#C9A227]/20 bg-stone-50 dark:bg-[#071527] text-gray-500 font-semibold uppercase">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor Email</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Entity ID</th>
                      <th className="p-3">State Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-crown-gold/5 transition">
                        <td className="p-3 whitespace-nowrap text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })}
                        </td>
                        <td className="p-3 font-semibold text-crown-navy dark:text-crown-ivory whitespace-nowrap">
                          {log.user_email}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crown-gold/20 text-crown-gold-dark dark:text-crown-gold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-crown-terracotta whitespace-nowrap">{log.entity_name}</td>
                        <td className="p-3 text-gray-400 truncate max-w-[120px]">{log.entity_id}</td>
                        <td className="p-3 max-w-[280px] truncate text-gray-500">
                          {log.after_state ? JSON.stringify(log.after_state) : 'DELETED'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 6: PROPERTY SETTINGS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            {/* --------------------------------------------------------------- */}
            {/* 1. SUPABASE CLOUD DATABASE & REALTIME SYNC */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white dark:bg-[#0B1F3A]/80 p-6 sm:p-8 rounded-2xl border border-[#C9A227]/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-crown-gold/15 text-crown-gold border border-crown-gold/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold flex items-center gap-2">
                      <span>Supabase Cloud Database &amp; Realtime Sync</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Production PostgreSQL database with row-level security and real-time WebSocket replication.
                    </p>
                  </div>
                </div>

                <div>
                  {isLiveConnected ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live Cloud Connected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Local In-Memory Mode (Demo)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Banner when test or verification is triggered */}
              {supabaseVerifyResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                    supabaseVerifyResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {supabaseVerifyResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">
                      {supabaseVerifyResult.success ? 'Supabase Connection Verified' : 'Connection Failed'}
                    </p>
                    <p className="opacity-90">{supabaseVerifyResult.message}</p>
                  </div>
                </div>
              )}

              {/* Table Count Inspection Banner */}
              {dbQueryResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                    dbQueryResult.success
                      ? 'bg-[#0B1F3A]/40 border-crown-gold/40 text-crown-navy dark:text-crown-ivory'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <Server className="w-5 h-5 text-crown-gold flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <p className="font-bold text-crown-gold">PostgreSQL Table Diagnostics</p>
                    <p className="opacity-90">{dbQueryResult.message}</p>
                    {dbQueryResult.tableCounts && (
                      <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 text-center">
                          <span className="text-gray-400 block text-[9px] uppercase">Categories</span>
                          <span className="text-sm font-bold text-crown-gold">{dbQueryResult.tableCounts.categories}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 text-center">
                          <span className="text-gray-400 block text-[9px] uppercase">Menu Items</span>
                          <span className="text-sm font-bold text-crown-gold">{dbQueryResult.tableCounts.items}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 text-center">
                          <span className="text-gray-400 block text-[9px] uppercase">Service Points</span>
                          <span className="text-sm font-bold text-crown-gold">{dbQueryResult.tableCounts.servicePoints}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Configuration Inputs */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-crown-navy dark:text-crown-ivory">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-ref.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm font-mono focus:outline-none focus:border-crown-gold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    From your Supabase Project Settings → API → Project URL.
                  </span>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-crown-navy dark:text-crown-ivory">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm font-mono focus:outline-none focus:border-crown-gold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    From your Supabase Project Settings → API → Project API Keys (<code className="font-mono text-crown-gold">anon public</code>).
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleVerifySupabase}
                    disabled={isVerifyingSupabase}
                    className="px-5 py-2.5 rounded-xl bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isVerifyingSupabase ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Connection...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Test &amp; Connect Live Supabase</span>
                      </>
                    )}
                  </button>

                  {isLiveConnected && (
                    <button
                      onClick={handleTestDatabaseQuery}
                      disabled={isQueryingDb}
                      className="px-4 py-2.5 rounded-xl border border-crown-gold/40 text-crown-gold font-bold text-xs hover:bg-crown-gold/10 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isQueryingDb ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking Tables...</span>
                        </>
                      ) : (
                        <>
                          <Server className="w-3.5 h-3.5" />
                          <span>Verify PostgreSQL Tables</span>
                        </>
                      )}
                    </button>
                  )}

                  {isLiveConnected && (
                    <button
                      onClick={handleDisconnectSupabase}
                      className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 font-semibold text-xs hover:bg-red-500/10 transition"
                    >
                      Disconnect &amp; Use Demo Store
                    </button>
                  )}

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-crown-gold flex items-center gap-1.5 transition"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* PostgreSQL Migration Guide Dropdown */}
              <div className="border-t border-[#C9A227]/20 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-crown-navy dark:text-crown-gold hover:opacity-80 py-1"
                >
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-crown-gold" />
                    <span>Database Migrations &amp; Schema Setup Instructions</span>
                  </span>
                  <span>{showSqlGuide ? '▲ Hide' : '▼ View Details'}</span>
                </button>

                {showSqlGuide && (
                  <div className="mt-3 p-4 rounded-xl bg-stone-100 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs space-y-3">
                    <p className="text-gray-600 dark:text-gray-300">
                      To deploy Crown Hotels Kenya to a fresh Supabase project, execute the SQL migration scripts in your Supabase SQL Editor:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                      <li>
                        <strong className="text-crown-navy dark:text-crown-ivory">Schema &amp; Policies:</strong>{' '}
                        <code>supabase/migrations/20261016_001_initial_schema.sql</code>
                      </li>
                      <li>
                        <strong className="text-crown-navy dark:text-crown-ivory">Crown Plaza Nairobi 5-Star Seed Data:</strong>{' '}
                        <code>supabase/migrations/20261016_002_seed_data.sql</code>
                      </li>
                    </ol>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleCopySqlInstructions}
                        className="px-3 py-1.5 rounded-lg bg-crown-gold/20 hover:bg-crown-gold/30 text-crown-gold font-bold text-[11px] flex items-center gap-1.5 transition"
                      >
                        {copiedMigrationSql ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Path Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Schema Path</span>
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-gray-400">
                        Zero-trust Row Level Security (RLS) &amp; Realtime publication included.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* 2. PROPERTY SETTINGS & OPERATIONAL POLICIES */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white dark:bg-[#0B1F3A]/80 p-6 sm:p-8 rounded-2xl border border-[#C9A227]/30 shadow-xl space-y-6">
              <div className="border-b border-[#C9A227]/20 pb-4">
                <h3 className="font-serif text-xl font-bold text-crown-navy dark:text-crown-gold flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-crown-gold" />
                  <span>Hotel &amp; Dining Operational Settings</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Dynamic currency rates, statutory service charge, and Kenya Data Protection Act compliance.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-crown-navy dark:text-crown-ivory">
                    USD Conversion Rate (KES per 1 USD)
                  </label>
                  <input
                    type="number"
                    value={settings.usd_exchange_rate}
                    onChange={(e) => setSettings({ ...settings, usd_exchange_rate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm font-semibold focus:outline-none focus:border-crown-gold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Used to display secondary international pricing for foreign guests.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-crown-navy dark:text-crown-ivory">
                    Service Charge Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={backendStore.getProperty().service_charge_pct}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm opacity-70 font-semibold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Standard 5.0% hospitality service charge configured for Crown Plaza Nairobi.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-crown-navy dark:text-crown-ivory">
                    Guest Data Retention (Days - Kenya Data Protection Act 2019)
                  </label>
                  <input
                    type="number"
                    value={settings.retention_days}
                    onChange={(e) => setSettings({ ...settings, retention_days: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm font-semibold focus:outline-none focus:border-crown-gold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Complies with KDPA statutory audit and guest consent anonymization guidelines.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      backendStore.updateSettings(settings);
                      notify('Hotel settings saved and synchronized across all active displays.');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold hover:opacity-90 transition shadow-md flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Hotel Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT MENU ITEM */}
      {/* --------------------------------------------------------------------- */}
      {(isCreatingItem || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0B1F3A] rounded-2xl border border-[#C9A227]/40 max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-gold">
                {editingItem ? `Edit "${editingItem.name_en}"` : 'Add New Gastronomic Item'}
              </h3>
              <button
                onClick={() => { setEditingItem(null); setIsCreatingItem(false); }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">English Dish Name</label>
                  <input
                    type="text"
                    required
                    value={itemForm.nameEn}
                    onChange={(e) => setItemForm({ ...itemForm, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                    placeholder="e.g. Swahili Fish Curry"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Kiswahili Dish Name (Bilingual)</label>
                  <input
                    type="text"
                    required
                    value={itemForm.nameSw}
                    onChange={(e) => setItemForm({ ...itemForm, nameSw: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                    placeholder="e.g. Mchuzi wa Samaki wa Nazi"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en} ({c.name_sw})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">English Description</label>
                  <textarea
                    rows={2}
                    value={itemForm.descEn}
                    onChange={(e) => setItemForm({ ...itemForm, descEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:border-crown-gold"
                    placeholder="Culinary ingredients and presentation details..."
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Kiswahili Description</label>
                  <textarea
                    rows={2}
                    value={itemForm.descSw}
                    onChange={(e) => setItemForm({ ...itemForm, descSw: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:border-crown-gold"
                    placeholder="Maelezo ya viungo na jinsi kinavyotayarishwa..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-1">Price in Whole KES</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={itemForm.priceKes}
                    onChange={(e) => setItemForm({ ...itemForm, priceKes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={itemForm.prepMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Spice Level (0 - 3)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={itemForm.spiceLevel}
                    onChange={(e) => setItemForm({ ...itemForm, spiceLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm focus:border-crown-gold"
                  />
                </div>
              </div>

              {/* Dietary Flags Checkboxes */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <span className="block font-bold mb-2">Dietary &amp; Highlight Badges</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isChefsPick}
                      onChange={(e) => setItemForm({ ...itemForm, isChefsPick: e.target.checked })}
                      className="rounded text-crown-gold"
                    />
                    <span>Chef's Pick</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isHalal}
                      onChange={(e) => setItemForm({ ...itemForm, isHalal: e.target.checked })}
                      className="rounded text-crown-gold"
                    />
                    <span>Halal Certified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isVegetarian}
                      onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
                      className="rounded text-crown-gold"
                    />
                    <span>Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isGlutenFree}
                      onChange={(e) => setItemForm({ ...itemForm, isGlutenFree: e.target.checked })}
                      className="rounded text-crown-gold"
                    />
                    <span>Gluten Free</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => { setEditingItem(null); setIsCreatingItem(false); }}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-xs shadow-md"
                >
                  Save Item to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: BULK PRICE ADJUSTMENT */}
      {/* --------------------------------------------------------------------- */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1F3A] rounded-2xl border border-[#C9A227]/40 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-gold">Bulk Price Change</h3>
            <p className="text-xs text-gray-500">
              Apply a percentage increase or decrease across all items in a category simultaneously.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Target Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs"
                >
                  <option value="all">Choose a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Percentage Change (%)</label>
                <input
                  type="number"
                  step={1}
                  value={bulkPricePercent}
                  onChange={(e) => setBulkPricePercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-sm font-bold"
                  placeholder="+5 for 5% increase, -10 for 10% discount"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setShowBulkPriceModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyBulkPrice}
                  className="px-5 py-2 rounded-xl bg-crown-gold text-crown-navy font-bold text-xs shadow-md"
                >
                  Apply Bulk Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: PRINTABLE A4 TABLE TENT WITH BRANDING */}
      {/* --------------------------------------------------------------------- */}
      {selectedTableTent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 text-[#0B1F3A] shadow-2xl relative">
            <button
              onClick={() => setSelectedTableTent(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black no-print"
            >
              ✕
            </button>

            {/* Table Tent Card Content */}
            <div className="border-4 border-[#C9A227] p-8 rounded-2xl space-y-5 bg-[#FAF6EC]">
              <img src="/brand/crown-monogram.svg" alt="Crown Monogram" className="w-14 h-14 mx-auto shadow-md" />
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-widest text-[#0B1F3A]">CROWN HOTELS</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#B4532A] font-bold">DIGITAL GUEST MENU</p>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-inner border border-[#C9A227]/30 inline-block">
                <img src={selectedTableTent.qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>

              <div className="space-y-1">
                <span className="font-serif text-xl font-bold text-[#0B1F3A]">{selectedTableTent.sp.label}</span>
                <p className="text-xs text-gray-600">Scan to browse our visual menu &amp; order</p>
                <p className="text-[10px] text-gray-400 font-mono pt-1">Token: {selectedTableTent.sp.qr_token.substring(0, 16)}...</p>
              </div>

              <div className="border-t border-[#C9A227]/30 pt-3 text-[11px] text-[#0B1F3A]/80 font-medium">
                M-Pesa Express · Card · Room Charge
              </div>
            </div>

            {/* Print trigger */}
            <div className="flex justify-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-full bg-[#0B1F3A] text-[#FAF6EC] font-bold text-xs flex items-center gap-2 hover:bg-[#142C4E] shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Tent (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
