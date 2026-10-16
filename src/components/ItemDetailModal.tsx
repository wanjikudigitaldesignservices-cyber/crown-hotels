import React, { useState } from 'react';
import { MenuItem, SelectedModifier } from '../types/database';
import { formatKES, formatUSD } from '../lib/supabase';
import { 
  X, 
  Plus, 
  Minus, 
  Sparkles, 
  Award, 
  Flame, 
  Clock, 
  AlertTriangle, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface Props {
  item: MenuItem;
  currency: 'KES' | 'USD';
  usdRate: number;
  lang: 'en' | 'sw';
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, selectedModifiers: SelectedModifier[], instructions?: string) => void;
  onSelectPairing?: (pairingItem: MenuItem) => void;
}

export const ItemDetailModal: React.FC<Props> = ({
  item,
  currency,
  usdRate,
  lang,
  onClose,
  onAddToCart,
  onSelectPairing,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedMods, setSelectedMods] = useState<Record<string, string>>({}); // groupId -> modifierId
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Default select required modifiers
  React.useEffect(() => {
    const defaults: Record<string, string> = {};
    item.modifier_groups?.forEach((group) => {
      const def = group.modifiers?.find((m) => m.is_default) || group.modifiers?.[0];
      if (def) {
        defaults[group.id] = def.id;
      }
    });
    setSelectedMods(defaults);
  }, [item]);

  // Compute total with modifier price deltas
  let modifierPriceDelta = 0;
  const chosenModsList: SelectedModifier[] = [];

  item.modifier_groups?.forEach((group) => {
    const chosenModId = selectedMods[group.id];
    if (chosenModId) {
      const mod = group.modifiers?.find((m) => m.id === chosenModId);
      if (mod) {
        modifierPriceDelta += mod.price_delta_kes;
        chosenModsList.push({
          modifier_id: mod.id,
          group_id: group.id,
          name_en: mod.name_en,
          name_sw: mod.name_sw,
          price_delta_kes: mod.price_delta_kes,
        });
      }
    }
  });

  const unitTotalKES = item.price_kes + modifierPriceDelta;
  const lineTotalKES = unitTotalKES * quantity;

  const handleModifierSelect = (groupId: string, modifierId: string) => {
    setSelectedMods((prev) => ({
      ...prev,
      [groupId]: modifierId,
    }));
  };

  const handleAdd = () => {
    onAddToCart(item, quantity, chosenModsList, specialInstructions.trim() || undefined);
    onClose();
  };

  const primaryImg = item.images?.[0]?.storage_path || '/images/menu/dish.webp';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#0B1F3A] w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-[#C9A227]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
      >
        {/* Header Image */}
        <div className="relative aspect-[16/10] bg-stone-900 flex-shrink-0">
          <img 
            src={primaryImg} 
            alt={item.name_en} 
            className="w-full h-full object-cover" 
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on image */}
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
            {item.is_chefs_pick && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1F3A]/90 text-crown-gold backdrop-blur border border-crown-gold/40 shadow-sm">
                <Award className="w-3.5 h-3.5" /> {lang === 'sw' ? 'Pendekezo la Mpishi' : "Chef's Pick"}
              </span>
            )}
            {item.spice_level > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 backdrop-blur border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-crown-terracotta" />
                <span>{lang === 'sw' ? 'Pilipili' : 'Spicy'} ({item.spice_level}/3)</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          {/* Title & Price */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-crown-navy dark:text-crown-ivory">
                {lang === 'sw' ? item.name_sw : item.name_en}
              </h2>
              <div className="text-right">
                <p className="font-bold text-xl text-crown-navy dark:text-crown-gold whitespace-nowrap">
                  {currency === 'KES' ? formatKES(unitTotalKES) : formatUSD(unitTotalKES, usdRate)}
                </p>
                <p className="text-[11px] text-gray-400">16% VAT &amp; 5% Serv. Incl.</p>
              </div>
            </div>
            <p className="text-xs text-crown-terracotta font-serif italic">
              {lang === 'sw' ? item.name_en : item.name_sw}
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
            {lang === 'sw' ? item.description_sw : item.description_en}
          </p>

          {/* Prep time & Dietary */}
          <div className="flex flex-wrap items-center gap-3 py-2 border-y border-stone-200 dark:border-stone-800 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-crown-gold" />
              <span>{lang === 'sw' ? 'Wakati:' : 'Prep time:'} ~{item.prep_minutes} {lang === 'sw' ? 'dakika' : 'mins'}</span>
            </div>
            {item.dietary_flags.halal && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Halal
              </span>
            )}
            {item.dietary_flags.vegetarian && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🌱 Vegetarian</span>
            )}
            {item.dietary_flags.gluten_free && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Gluten-Free</span>
            )}
          </div>

          {/* Allergens warning if any */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{lang === 'sw' ? 'Tahadhari ya Mzio' : 'Allergen Advisory'}:</strong> Contains {item.allergens.join(', ')}.
              </div>
            </div>
          )}

          {/* Modifier Groups (e.g. Choose Your Side, Doneness) */}
          {item.modifier_groups && item.modifier_groups.length > 0 && (
            <div className="space-y-4">
              {item.modifier_groups.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-crown-navy dark:text-crown-gold uppercase tracking-wider">
                      {lang === 'sw' ? group.name_sw : group.name_en}
                    </span>
                    {group.is_required && (
                      <span className="text-[10px] text-crown-terracotta bg-crown-terracotta/10 px-2 py-0.5 rounded-full font-bold">
                        {lang === 'sw' ? 'Lazima' : 'Required'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.modifiers?.map((mod) => {
                      const isSelected = selectedMods[group.id] === mod.id;

                      return (
                        <div
                          key={mod.id}
                          onClick={() => handleModifierSelect(group.id, mod.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'border-crown-gold bg-crown-gold/10 text-crown-navy dark:text-crown-gold font-bold shadow-sm'
                              : 'border-stone-200 dark:border-stone-800 hover:border-crown-gold/50 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-crown-gold bg-crown-gold' : 'border-stone-400'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{lang === 'sw' ? mod.name_sw : mod.name_en}</span>
                          </div>
                          {mod.price_delta_kes > 0 && (
                            <span className="text-[11px] text-crown-terracotta font-semibold">
                              +{formatKES(mod.price_delta_kes)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upsell Pairings ("Goes well with") */}
          {item.pairings && item.pairings.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-serif text-sm font-bold text-crown-navy dark:text-crown-gold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-crown-gold" />
                <span>{lang === 'sw' ? 'Inafaa Sana Na' : 'Goes Well With (Sommelier Recommendation)'}</span>
              </h3>

              <div className="space-y-2">
                {item.pairings.map((p) => {
                  if (!p.suggested_item) return null;
                  const suggested = p.suggested_item;
                  const sugImg = suggested.images?.[0]?.storage_path || '/images/menu/dish.webp';

                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectPairing?.(suggested)}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 hover:border-crown-gold transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={sugImg} 
                          alt={suggested.name_en} 
                          className="w-12 h-12 object-cover rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm"
                        />
                        <div>
                          <p className="font-serif font-bold text-xs text-crown-navy dark:text-crown-ivory group-hover:text-crown-gold transition">
                            {lang === 'sw' ? suggested.name_sw : suggested.name_en}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{p.note_en}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-xs text-crown-gold">
                          {currency === 'KES' ? formatKES(suggested.price_kes) : formatUSD(suggested.price_kes, usdRate)}
                        </span>
                        <div className="flex items-center justify-end text-[10px] text-crown-terracotta font-semibold mt-0.5">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Request Note */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-gray-500">
              {lang === 'sw' ? 'Maagizo Maalumu kwa Jiko' : 'Special Kitchen Instructions (Optional)'}
            </label>
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Mfano: bila chumvi nyingi, kachumbari pembeni...' : 'e.g. dressing on the side, extra crispy, no ice...'}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#071527] border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-crown-gold"
            />
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-[#0B1F3A]/90 backdrop-blur flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 p-1 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#071527]">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold font-sans text-sm w-5 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-6 rounded-full bg-crown-navy dark:bg-crown-gold text-crown-ivory dark:text-crown-navy font-bold text-sm tracking-wide hover:opacity-90 transition shadow-crown-gold flex items-center justify-between"
          >
            <span>{lang === 'sw' ? 'Ongeza kwenye Agizo' : 'Add to Order'}</span>
            <span>{currency === 'KES' ? formatKES(lineTotalKES) : formatUSD(lineTotalKES, usdRate)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
