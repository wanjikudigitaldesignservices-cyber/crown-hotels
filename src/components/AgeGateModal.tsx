import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  lang: 'en' | 'sw';
}

export const AgeGateModal: React.FC<Props> = ({ isOpen, onConfirm, onDecline, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0B1F3A] text-white rounded-3xl border border-[#C9A227]/40 max-w-sm w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="font-mono text-[11px] font-bold text-crown-gold tracking-widest uppercase">
            {lang === 'sw' ? 'SHERIA ZA POMBE ZA KENYA' : 'KENYA ALCOHOLIC DRINKS CONTROL ACT'}
          </span>
          <h3 className="font-serif text-2xl font-bold text-crown-gold">
            {lang === 'sw' ? 'Uthibitisho wa Umri wa Miaka 18+' : '18+ Age Verification Required'}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed pt-1">
            {lang === 'sw'
              ? 'Jamhuri ya Kenya inakataza uuzaji wa vileo kwa walio chini ya miaka 18. Je, umefikisha umri wa miaka 18 au zaidi?'
              : 'Under the Alcoholic Drinks Control Act of Kenya, you must be 18 years of age or older to view and order alcoholic beverages, wines, beers, and cocktails.'}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-full bg-crown-gold text-crown-navy font-bold text-xs uppercase tracking-wider hover:bg-crown-gold-light transition shadow-crown-gold flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'sw' ? 'Ndio, Nina Miaka 18 au Zaidi' : 'Yes, I am 18 or Older'}</span>
          </button>

          <button
            onClick={onDecline}
            className="w-full py-2.5 rounded-full border border-stone-600 text-stone-400 hover:text-white text-xs font-semibold transition"
          >
            {lang === 'sw' ? 'Hapana, Rudi kwenye Menyu Kuu' : 'No, Return to Non-Alcoholic Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};
