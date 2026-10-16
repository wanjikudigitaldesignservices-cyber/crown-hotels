import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Check, 
  Copy, 
  ExternalLink, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Award, 
  ArrowRight,
  Heart,
  Plus
} from 'lucide-react';

export const BrandSheet: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const colors = [
    { name: 'Deep Navy', hex: '#0B1F3A', role: 'Primary brand, luxury headers, dark mode card background', textLight: true },
    { name: 'Crown Gold', hex: '#C9A227', role: 'Accent metal, premium badges, CTA accents, monogram', textLight: false },
    { name: 'Ivory', hex: '#FAF6EC', role: 'Warm background, card base, light mode primary surface', textLight: false },
    { name: 'Savanna Terracotta', hex: '#B4532A', role: 'Kenyan warmth, action highlights, spice & grill badges', textLight: true },
    { name: 'Charcoal', hex: '#1C1C1C', role: 'Deep typography, high contrast text on ivory', textLight: true },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#071527] text-[#FAF6EC]' : 'bg-[#FAF6EC] text-[#1C1C1C]'}`}>
      {/* Top Bar */}
      <header className="border-b border-[#C9A227]/20 bg-background/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/crown-monogram.svg" alt="Crown Monogram" className="w-10 h-10 shadow-md" />
            <div>
              <h1 className="font-serif text-xl font-bold tracking-wider text-crown-navy dark:text-crown-gold">CROWN HOTELS</h1>
              <p className="text-xs uppercase tracking-widest text-crown-terracotta font-semibold">Brand Design System &amp; Style Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A227]/30 text-xs font-medium hover:bg-crown-gold/10 transition"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-crown-gold" /> : <Moon className="w-3.5 h-3.5 text-crown-navy" />}
              <span>{isDark ? 'Light Ivory' : 'Dark Navy'}</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-semibold hover:opacity-90 transition"
            >
              <span>View Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-16">
        {/* Intro */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crown-gold/15 text-crown-gold-dark dark:text-crown-gold text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Identity Package · Phase 2</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-crown-navy dark:text-crown-gold">
            The Crown Hotels Aesthetic
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
            Crafted for discerning guests in Kenya. A seamless synthesis of British colonial luxury heritage, 
            modern African warmth, and editorial gastronomic presentation. Designed mobile-first for rapid 
            ordering at poolside loungers, fine dining rooms, and safari bars.
          </p>
        </section>

        {/* 1. Logos & Monograms */}
        <section className="space-y-6">
          <h3 className="font-serif text-2xl font-bold border-b border-[#C9A227]/20 pb-3 flex items-center justify-between">
            <span>1. Wordmark &amp; Monogram Vectors</span>
            <span className="text-xs font-sans text-crown-terracotta uppercase tracking-wider font-semibold">100% SVG Vector</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Horizontal Light BG */}
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Primary Horizontal Wordmark</span>
              <img src="/brand/crown-logo.svg" alt="Crown Hotels Logo" className="h-16 w-auto" />
              <p className="text-xs text-gray-500 text-center font-sans">Used on guest navigation, digital invoices, and A4 printable table-tents.</p>
            </div>

            {/* Dark BG Wordmark */}
            <div className="p-8 rounded-2xl bg-[#0B1F3A] border border-[#C9A227]/30 flex flex-col items-center justify-center space-y-4 shadow-md">
              <span className="text-xs uppercase tracking-widest text-crown-gold/70 font-semibold">Dark Theme Wordmark</span>
              <img src="/brand/crown-logo-light.svg" alt="Crown Hotels Logo Light" className="h-16 w-auto" />
              <p className="text-xs text-gray-400 text-center font-sans">Used in night-time dining ambiance, bar menus, and poolside lounge modes.</p>
            </div>

            {/* Monogram Solo */}
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Royal Monogram Shield</span>
              <img src="/brand/crown-monogram.svg" alt="Crown Monogram" className="w-24 h-24 shadow-crown-gold" />
              <p className="text-xs text-gray-500 text-center font-sans">Favicon, PWA App Icon, and watermark seal on verified receipts.</p>
            </div>

            {/* Typography Spec */}
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 flex flex-col justify-center space-y-4 shadow-sm">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Typography Pairing</span>
              <div>
                <p className="text-xs uppercase text-crown-gold font-bold tracking-wider">Display Heading (Playfair Display)</p>
                <p className="font-serif text-3xl font-bold text-crown-navy dark:text-crown-ivory">Authentic Kenyan Dining</p>
              </div>
              <div>
                <p className="text-xs uppercase text-crown-terracotta font-bold tracking-wider">Body &amp; Interface (Inter)</p>
                <p className="font-sans text-sm text-gray-600 dark:text-gray-300">
                  Clean, legible numerals for KES 1,850 pricing, allergen disclosures, and instant mobile touch interactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Color Palette */}
        <section className="space-y-6">
          <h3 className="font-serif text-2xl font-bold border-b border-[#C9A227]/20 pb-3 flex items-center justify-between">
            <span>2. Curated Brand Color Palette</span>
            <span className="text-xs font-sans text-gray-500 font-normal">Click swatch to copy HEX code</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {colors.map((c) => (
              <div 
                key={c.name}
                onClick={() => copyToClipboard(c.hex, c.name)}
                className="cursor-pointer group rounded-xl overflow-hidden border border-[#C9A227]/20 shadow-sm hover:shadow-md transition bg-white dark:bg-[#0B1F3A]/40 flex flex-col"
              >
                <div 
                  className="h-28 flex items-end justify-between p-3 transition group-hover:scale-[1.02]"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded backdrop-blur-sm ${c.textLight ? 'text-white bg-black/30' : 'text-black bg-white/50'}`}>
                    {c.hex}
                  </span>
                  {copied === c.name ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition ${c.textLight ? 'text-white' : 'text-black'}`} />
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h4 className="font-serif font-bold text-sm text-crown-navy dark:text-crown-gold">{c.name}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Component Kit (Buttons, Badges, Chips) */}
        <section className="space-y-6">
          <h3 className="font-serif text-2xl font-bold border-b border-[#C9A227]/20 pb-3">
            3. UI Components &amp; Micro-Interactions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-crown-terracotta font-bold">Button Hierarchy</h4>
              <div className="flex flex-wrap gap-3">
                <button className="px-5 py-2.5 rounded-full bg-crown-navy text-crown-ivory text-sm font-semibold hover:bg-crown-navy-light transition shadow-sm">
                  Primary Navy
                </button>
                <button className="px-5 py-2.5 rounded-full bg-crown-gold text-crown-navy text-sm font-bold hover:bg-crown-gold-light transition shadow-crown-gold">
                  Crown Gold CTA
                </button>
                <button className="px-5 py-2.5 rounded-full bg-crown-terracotta text-white text-sm font-semibold hover:bg-crown-terracotta-dark transition shadow-sm">
                  Savanna Terracotta
                </button>
                <button className="px-5 py-2.5 rounded-full border border-crown-navy dark:border-crown-gold text-crown-navy dark:text-crown-gold text-sm font-semibold hover:bg-crown-gold/10 transition">
                  Outline Subtle
                </button>
              </div>
            </div>

            {/* Badges & Chips */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/20 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-crown-terracotta font-bold">Dietary &amp; Culinary Badges</h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-crown-gold/15 text-crown-gold-dark dark:text-crown-gold border border-crown-gold/30">
                  <Award className="w-3.5 h-3.5" /> Chef's Pick
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  🌱 Vegetarian
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  🌿 100% Vegan
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Halal Certified
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-crown-terracotta" /> Spicy 🌶️🌶️
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  18+ Age Gate
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Interactive Dish Card Example */}
        <section className="space-y-6">
          <h3 className="font-serif text-2xl font-bold border-b border-[#C9A227]/20 pb-3">
            4. Signature Guest Dish Card Component
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Nyama Choma */}
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0B1F3A]/70 border border-[#C9A227]/25 shadow-crown-card flex flex-col group">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-900">
                <img 
                  src="/images/menu/nyama-choma.webp" 
                  alt="Nyama Choma" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0B1F3A]/90 text-crown-gold backdrop-blur border border-crown-gold/40 shadow-sm">
                    <Award className="w-3 h-3" /> Chef's Pick
                  </span>
                </div>
                <button className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 transition">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-lg text-crown-navy dark:text-crown-ivory leading-snug">
                      Nyama Choma ½kg
                    </h4>
                    <span className="font-sans font-bold text-base text-crown-navy dark:text-crown-gold whitespace-nowrap">
                      KES 1,850
                    </span>
                  </div>
                  <p className="text-xs text-crown-terracotta italic font-medium">Nyama Choma Nusu Kilo na Ugali</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                    Open-flame grilled tender goat or beef cuts, seasoned with sea salt, served sizzling on a rustic wooden board with steaming hot white ugali and zesty kachumbari.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">Prep: ~25 mins</span>
                  <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Dawa Cocktail */}
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0B1F3A]/70 border border-[#C9A227]/25 shadow-crown-card flex flex-col group">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-900">
                <img 
                  src="/images/menu/dawa-cocktail.webp" 
                  alt="Dawa Cocktail" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#B4532A]/90 text-white backdrop-blur border border-white/20 shadow-sm">
                    18+ Alcohol
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-lg text-crown-navy dark:text-crown-ivory leading-snug">
                      Kenyan Dawa Cocktail
                    </h4>
                    <span className="font-sans font-bold text-base text-crown-navy dark:text-crown-gold whitespace-nowrap">
                      KES 800
                    </span>
                  </div>
                  <p className="text-xs text-crown-terracotta italic font-medium">Kogoti ya Dawa Halisi</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                    Kenya's iconic cocktail: premium vodka, freshly muddled lime quarters, crushed ice, and local acacia honey churned with a genuine Dawa wooden stick.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">Bar ~4 mins</span>
                  <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Kenyan Breakfast */}
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0B1F3A]/70 border border-[#C9A227]/25 shadow-crown-card flex flex-col group">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-900">
                <img 
                  src="/images/menu/kenyan-breakfast.webp" 
                  alt="Kenyan Breakfast" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0B1F3A]/90 text-crown-gold backdrop-blur border border-crown-gold/40 shadow-sm">
                    Daypart: 06:00 - 11:00
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-lg text-crown-navy dark:text-crown-ivory leading-snug">
                      Kenyan Breakfast
                    </h4>
                    <span className="font-sans font-bold text-base text-crown-navy dark:text-crown-gold whitespace-nowrap">
                      KES 1,200
                    </span>
                  </div>
                  <p className="text-xs text-crown-terracotta italic font-medium">Kiamsha Kinywa cha Kenya</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                    Freshly fried golden mandazi, flaky chapati, farm-fresh eggs cooked to style, beef or chicken sausage, accompanied by authentic spiced Kenyan chai.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">Prep: ~15 mins</span>
                  <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy text-xs font-bold hover:opacity-90 transition">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#C9A227]/20 py-8 px-6 text-center text-xs text-gray-500">
        <p>© 2026 Crown Hotels Kenya. All brand tokens, photography, and menu designs protected under Kenya Copyright Law.</p>
      </footer>
    </div>
  );
};
