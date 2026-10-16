import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MenuItem, 
  MenuCategory, 
  Outlet, 
  Property, 
  ServicePoint, 
  Order, 
  Payment,
  SelectedModifier 
} from '../types/database';
import { 
  backendStore, 
  formatKES, 
  formatUSD, 
  realtimeBus 
} from '../lib/supabase';
import { 
  Search, 
  Heart, 
  Plus, 
  ShoppingBag, 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  Receipt, 
  Award, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Filter, 
  X, 
  Check, 
  ChevronRight, 
  Share2,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { ItemDetailModal } from './ItemDetailModal';
import { CartDrawer, CartItem } from './CartDrawer';
import { OrderTracker } from './OrderTracker';
import { AgeGateModal } from './AgeGateModal';

interface Props {
  qrToken?: string;
  initialItemSlug?: string;
}

export const GuestMenu: React.FC<Props> = ({ qrToken, initialItemSlug }) => {
  // Context resolution
  const [resolvedContext, setResolvedContext] = useState<{
    servicePoint: ServicePoint;
    outlet: Outlet;
    property: Property;
  } | null>(null);

  // Settings & Toggles
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [usdRate, setUsdRate] = useState<number>(130.0);

  // Data states
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDietaryFilter, setActiveDietaryFilter] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [under1000Only, setUnder1000Only] = useState<boolean>(false);

  // Local Favourites
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Interactive UI modals
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  // 18+ Alcohol Age Gate
  const [showAgeGate, setShowAgeGate] = useState<boolean>(false);
  const [hasPassedAgeGate, setHasPassedAgeGate] = useState<boolean>(false);
  const [targetAlcoholCatSlug, setTargetAlcoholCatSlug] = useState<string | null>(null);

  // Offline indicator
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Category refs for scroll-spy
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load & Context Resolution
  useEffect(() => {
    // Load favorites from local storage
    try {
      const savedFavs = localStorage.getItem('crown_favs');
      if (savedFavs) {
        setFavoriteIds(new Set(JSON.parse(savedFavs)));
      }
    } catch {}

    // Load age verification from session
    if (sessionStorage.getItem('crown_age_verified') === 'true') {
      setHasPassedAgeGate(true);
    }

    // Resolve context by QR token or fallback to default Table 1
    const token = qrToken || 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc';
    const ctx = backendStore.resolveServicePointByToken(token);
    if (ctx) {
      setResolvedContext(ctx);
      const cats = backendStore.getCategories(ctx.outlet.id);
      setCategories(cats);
      setItems(backendStore.getItems());
      if (cats.length > 0) {
        // Auto-select morning breakfast or daytime category
        const nowHour = new Date().getHours();
        if (nowHour >= 6 && nowHour < 11 && cats.some((c) => c.slug === 'breakfast')) {
          setActiveCategorySlug('breakfast');
        } else {
          setActiveCategorySlug(cats[0].slug);
        }
      }
    }

    const settings = backendStore.getSettings();
    setUsdRate(settings.usd_exchange_rate);

    // If deep link item slug provided
    if (initialItemSlug) {
      const deepItem = backendStore.getItems().find((i) => i.images?.[0]?.storage_path.includes(initialItemSlug));
      if (deepItem) {
        setSelectedItemDetail(deepItem);
      }
    }

    // Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Realtime listeners
    const off1 = realtimeBus.on('menu:availability_changed', () => {
      setItems(backendStore.getItems());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      off1();
    };
  }, [qrToken, initialItemSlug]);

  // Toggle favorite
  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(favoriteIds);
    if (next.has(itemId)) {
      next.delete(itemId);
      showToast(lang === 'sw' ? 'Imeondolewa kwenye vipendwa' : 'Removed from favourites');
    } else {
      next.add(itemId);
      showToast(lang === 'sw' ? 'Imeongezwa kwenye vipendwa' : 'Saved to favourites ❤️');
    }
    setFavoriteIds(next);
    try {
      localStorage.setItem('crown_favs', JSON.stringify(Array.from(next)));
    } catch {}
  };

  // Scroll to category with smooth jump
  const scrollToCategory = (catSlug: string, isAlcohol: boolean) => {
    if (isAlcohol && !hasPassedAgeGate) {
      setTargetAlcoholCatSlug(catSlug);
      setShowAgeGate(true);
      return;
    }

    setActiveCategorySlug(catSlug);
    const el = categoryRefs.current[catSlug];
    if (el) {
      const yOffset = -130; // accounts for sticky header & tabs
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleAgeConfirm = () => {
    setHasPassedAgeGate(true);
    sessionStorage.setItem('crown_age_verified', 'true');
    setShowAgeGate(false);
    if (targetAlcoholCatSlug) {
      scrollToCategory(targetAlcoholCatSlug, false);
      setTargetAlcoholCatSlug(null);
    }
  };

  // Cart Management
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedModifiers: SelectedModifier[],
    instructions?: string
  ) => {
    setCartItems((prev) => {
      // If matching item and same modifiers, increment
      const existingIdx = prev.findIndex(
        (ci) => ci.item.id === item.id && 
                JSON.stringify(ci.selectedModifiers) === JSON.stringify(selectedModifiers) &&
                ci.specialInstructions === instructions
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { item, quantity, selectedModifiers, specialInstructions: instructions }];
    });
    showToast(lang === 'sw' ? `Imeongezwa: ${item.name_sw}` : `Added to order: ${item.name_en}`);
  };

  const handleUpdateCartQty = (idx: number, newQty: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      if (newQty <= 0) {
        copy.splice(idx, 1);
      } else {
        copy[idx].quantity = newQty;
      }
      return copy;
    });
  };

  const handleRemoveCartItem = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCartCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  // Assistance requests
  const handleCallWaiter = () => {
    if (!resolvedContext) return;
    try {
      backendStore.requestStaffAssistance(resolvedContext.servicePoint.qr_token, 'call_waiter');
      showToast(lang === 'sw' ? 'Mhudumu ameitwa kwenye meza yako! 🛎️' : 'Waiter called to your table! 🛎️');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestBill = () => {
    if (!resolvedContext) return;
    try {
      backendStore.requestStaffAssistance(resolvedContext.servicePoint.qr_token, 'request_bill');
      showToast(lang === 'sw' ? 'Ombi la bili limetumwa kwa kaunta! 🧾' : 'Bill requested from duty staff! 🧾');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Favorites filter
      if (favoritesOnly && !favoriteIds.has(item.id)) return false;

      // Price filter under 1000 KES
      if (under1000Only && item.price_kes >= 1000) return false;

      // Dietary filter
      if (activeDietaryFilter) {
        if (activeDietaryFilter === 'vegetarian' && !item.dietary_flags.vegetarian) return false;
        if (activeDietaryFilter === 'vegan' && !item.dietary_flags.vegan) return false;
        if (activeDietaryFilter === 'halal' && !item.dietary_flags.halal) return false;
        if (activeDietaryFilter === 'gluten_free' && !item.dietary_flags.gluten_free) return false;
        if (activeDietaryFilter === 'spicy' && item.spice_level === 0) return false;
      }

      // Search Query filter (bilingual)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
        const matchSw = item.name_sw.toLowerCase().includes(q) || item.description_sw.toLowerCase().includes(q);
        if (!matchEn && !matchSw) return false;
      }

      return true;
    });
  }, [items, favoritesOnly, favoriteIds, under1000Only, activeDietaryFilter, searchQuery]);

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#071527] text-[#FAF6EC]' : 'bg-[#FAF6EC] text-[#1C1C1C]'} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Offline Notice Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>You are currently browsing offline. Ordering requires an active internet connection.</span>
        </div>
      )}

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-crown-navy text-crown-gold text-xs font-bold border border-crown-gold/40 shadow-2xl animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1F3A]/95 backdrop-blur-md border-b border-[#C9A227]/25 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Table Context */}
          <div className="flex items-center gap-2.5">
            <img src="/brand/crown-monogram.svg" alt="Crown Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm tracking-wider text-crown-navy dark:text-crown-gold">CROWN HOTELS</span>
                {resolvedContext && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crown-gold/20 text-crown-navy dark:text-crown-ivory font-mono">
                    {resolvedContext.servicePoint.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px] sm:max-w-none">
                {resolvedContext?.outlet.name || 'Crown Plaza Nairobi'}
              </p>
            </div>
          </div>

          {/* Action Icons: Language, Currency, Dark Mode, Cart */}
          <div className="flex items-center gap-2">
            {/* Lang EN/SW Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              className="px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-800 text-[11px] font-bold text-crown-navy dark:text-crown-gold hover:bg-crown-gold/10 transition"
              title="Toggle Language (English / Kiswahili)"
            >
              {lang === 'en' ? 'SW' : 'EN'}
            </button>

            {/* Currency KES/USD Toggle */}
            <button
              onClick={() => setCurrency(currency === 'KES' ? 'USD' : 'KES')}
              className="px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-800 text-[11px] font-bold text-crown-navy dark:text-crown-gold hover:bg-crown-gold/10 transition font-mono"
              title="Toggle Currency"
            >
              {currency}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-full text-gray-500 hover:text-crown-gold transition"
              title="Toggle Low-Light Dining Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-crown-gold" /> : <Moon className="w-4 h-4 text-crown-navy" />}
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy hover:opacity-90 transition shadow-sm ml-1"
              aria-label="View Order Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-crown-terracotta text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-scale">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta chakula (Nyama choma, samaki, biriani, dawa...)' : 'Search authentic dishes, drinks, ingredients...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-100 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold transition text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 overflow-x-auto flex items-center gap-1.5 no-scrollbar text-xs">
          <button
            onClick={() => setActiveDietaryFilter(null)}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
              activeDietaryFilter === null && !favoritesOnly && !under1000Only
                ? 'bg-crown-navy text-crown-ivory dark:bg-crown-gold dark:text-crown-navy font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {lang === 'sw' ? 'Yote' : 'All'}
          </button>

          <button
            onClick={() => setActiveDietaryFilter(activeDietaryFilter === 'halal' ? null : 'halal')}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold flex items-center gap-1 transition ${
              activeDietaryFilter === 'halal'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Halal</span>
          </button>

          <button
            onClick={() => setActiveDietaryFilter(activeDietaryFilter === 'vegetarian' ? null : 'vegetarian')}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
              activeDietaryFilter === 'vegetarian'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            🌱 Vegetarian
          </button>

          <button
            onClick={() => setActiveDietaryFilter(activeDietaryFilter === 'spicy' ? null : 'spicy')}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold flex items-center gap-1 transition ${
              activeDietaryFilter === 'spicy'
                ? 'bg-crown-terracotta text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Spicy</span>
          </button>

          <button
            onClick={() => setUnder1000Only(!under1000Only)}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
              under1000Only
                ? 'bg-crown-gold text-crown-navy font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            &lt; KES 1,000
          </button>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold flex items-center gap-1 transition ${
              favoritesOnly
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Heart className="w-3 h-3" />
            <span>{lang === 'sw' ? 'Vipendwa' : 'Favourites'} ({favoriteIds.size})</span>
          </button>
        </div>

        {/* Sticky Horizontal Category Tabs */}
        <div className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0B1F3A] overflow-x-auto no-scrollbar">
          <div className="max-w-4xl mx-auto px-4 flex space-x-1">
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;

              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.slug, cat.is_alcohol)}
                  className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 ${
                    isActive
                      ? 'border-crown-gold text-crown-gold font-bold'
                      : 'border-transparent text-gray-500 hover:text-crown-navy dark:hover:text-crown-gold'
                  }`}
                >
                  <span>{lang === 'sw' ? cat.name_sw : cat.name_en}</span>
                  {cat.is_alcohol && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                      18+
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Hero Atmosphere Banner */}
      <section className="relative aspect-[21/9] sm:aspect-[24/8] max-h-56 overflow-hidden bg-stone-900">
        <img
          src="/images/hero/restaurant-hero.webp"
          alt="Crown Hotels Luxury Dining"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6">
          <div className="max-w-4xl mx-auto w-full space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-crown-gold">
              {lang === 'sw' ? 'KARIBU SANA' : 'EXECUTIVE HOSPITALITY'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {lang === 'sw' ? 'Vyakula Bora vya Kenya na Ulimwenguni' : 'Culinary Excellence at Crown Hotels'}
            </h1>
            <p className="text-xs text-stone-300 max-w-lg hidden sm:block">
              Order directly to your table, room, or poolside lounger. Freshly prepared by executive chefs.
            </p>
          </div>
        </div>
      </section>

      {/* Main Menu Body */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-12">
        {categories.map((cat) => {
          const categoryItems = filteredItems.filter((i) => i.category_id === cat.id);
          if (categoryItems.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={`cat-${cat.slug}`}
              ref={(el) => (categoryRefs.current[cat.slug] = el)}
              className="space-y-4 scroll-mt-36"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[#C9A227]/25 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-crown-navy dark:text-crown-ivory">
                      {lang === 'sw' ? cat.name_sw : cat.name_en}
                    </h2>
                    {cat.is_alcohol && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-500/30">
                        18+ Verification Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-crown-terracotta italic font-serif">
                    {lang === 'sw' ? cat.name_en : cat.name_sw}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {categoryItems.length} {lang === 'sw' ? 'vyakula' : 'dishes'}
                </span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {categoryItems.map((item) => {
                  const isFav = favoriteIds.has(item.id);
                  const primaryImg = item.images?.[0]?.storage_path || '/images/menu/dish.webp';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemDetail(item)}
                      className={`group rounded-2xl bg-white dark:bg-[#0B1F3A]/70 border border-[#C9A227]/20 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                        !item.is_available ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                        <img
                          src={primaryImg}
                          alt={item.name_en}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        
                        {/* Overlay Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          {item.is_chefs_pick && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B1F3A]/90 text-crown-gold backdrop-blur border border-crown-gold/40">
                              <Award className="w-3 h-3" /> Chef
                            </span>
                          )}
                          {!item.is_available && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/90 text-white backdrop-blur">
                              {lang === 'sw' ? 'Imeisha (Sold Out)' : 'Sold Out · Back Soon'}
                            </span>
                          )}
                        </div>

                        {/* Favorite Heart Button */}
                        <button
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 transition"
                          aria-label="Add to favourites"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-serif font-bold text-base text-crown-navy dark:text-crown-ivory group-hover:text-crown-gold transition">
                              {lang === 'sw' ? item.name_sw : item.name_en}
                            </h3>
                            <span className="font-bold text-sm text-crown-navy dark:text-crown-gold whitespace-nowrap">
                              {currency === 'KES' ? formatKES(item.price_kes) : formatUSD(item.price_kes, usdRate)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {lang === 'sw' ? item.description_sw : item.description_en}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span>~{item.prep_minutes}m</span>
                            {item.spice_level > 0 && (
                              <span className="text-crown-terracotta">🌶️{item.spice_level}</span>
                            )}
                          </div>

                          {item.is_available ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItemDetail(item);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{lang === 'sw' ? 'Weka' : 'Order'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating Bottom Quick Actions (Call Waiter / Bill) */}
      <aside aria-label="Table Service Actions" className="fixed bottom-6 right-6 z-30 flex flex-col gap-2.5">
        <button
          onClick={handleCallWaiter}
          className="p-3.5 rounded-full bg-crown-navy text-crown-gold border border-crown-gold/40 shadow-2xl hover:scale-105 transition flex items-center gap-2 group"
          title="Call Waiter"
        >
          <Bell className="w-5 h-5 text-crown-gold animate-bounce" />
          <span className="text-xs font-bold pr-1 hidden group-hover:inline transition">
            {lang === 'sw' ? 'Ita Mhudumu' : 'Call Waiter'}
          </span>
        </button>

        <button
          onClick={handleRequestBill}
          className="p-3.5 rounded-full bg-stone-900 text-crown-ivory border border-white/20 shadow-2xl hover:scale-105 transition flex items-center gap-2 group"
          title="Request Bill"
        >
          <Receipt className="w-5 h-5" />
          <span className="text-xs font-bold pr-1 hidden group-hover:inline transition">
            {lang === 'sw' ? 'Omba Bili' : 'Request Bill'}
          </span>
        </button>
      </aside>

      {/* Modals */}
      {selectedItemDetail && (
        <ItemDetailModal
          item={selectedItemDetail}
          currency={currency}
          usdRate={usdRate}
          lang={lang}
          onClose={() => setSelectedItemDetail(null)}
          onAddToCart={handleAddToCart}
          onSelectPairing={(pairingItem) => setSelectedItemDetail(pairingItem)}
        />
      )}

      {isCartOpen && resolvedContext && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          currency={currency}
          usdRate={usdRate}
          lang={lang}
          servicePointToken={resolvedContext.servicePoint.qr_token}
          servicePointLabel={resolvedContext.servicePoint.label}
          outletName={resolvedContext.outlet.name}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setCartItems([])}
          onOrderSuccess={(order, payment) => {
            setTrackedOrderId(order.id);
          }}
        />
      )}

      {trackedOrderId && (
        <OrderTracker
          orderId={trackedOrderId}
          onClose={() => setTrackedOrderId(null)}
          lang={lang}
        />
      )}

      <AgeGateModal
        isOpen={showAgeGate}
        onConfirm={handleAgeConfirm}
        onDecline={() => {
          setShowAgeGate(false);
          setTargetAlcoholCatSlug(null);
        }}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-[#C9A227]/20 py-8 px-4 text-center text-xs text-gray-500 space-y-2">
        <p className="font-serif text-sm font-bold text-crown-navy dark:text-crown-gold">CROWN HOTELS KENYA</p>
        <p>16% VAT Inclusive · 5% Hospitality Service Charge Added at Checkout</p>
        <div className="flex justify-center gap-4 text-[11px] pt-1">
          <a href="/privacy" className="hover:underline text-crown-terracotta">
            Kenya Data Protection Act, 2019 Privacy Statement
          </a>
          <span>·</span>
          <a href="/admin" className="hover:underline">Staff Portal</a>
          <span>·</span>
          <a href="/brand" className="hover:underline">Brand Sheet</a>
        </div>
      </footer>
    </div>
  );
};
