import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, FileText, Globe } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6EC] dark:bg-[#071527] text-[#1C1C1C] dark:text-[#FAF6EC] font-sans">
      <header className="border-b border-[#C9A227]/20 bg-white dark:bg-[#0B1F3A] px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-crown-navy dark:text-crown-gold hover:opacity-80 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Menu</span>
          </a>
          <span className="font-serif text-sm font-bold text-crown-navy dark:text-crown-gold">CROWN HOTELS KENYA</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kenya Data Protection Act, 2019 Compliant</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-crown-navy dark:text-crown-gold">
            Guest Privacy &amp; Data Protection Statement
          </h1>
          <p className="text-xs text-gray-500">
            Effective Date: 16 October 2026 · Crown Hotels Group (Kenya) Limited
          </p>
        </div>

        <div className="prose dark:prose-invert text-xs sm:text-sm space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-ivory">1. Purpose &amp; Scope</h2>
            <p>
              Crown Hotels Group is committed to safeguarding your privacy in full compliance with the 
              <strong>Kenya Data Protection Act, 2019</strong> enacted by the Parliament of Kenya. This policy 
              governs the collection, storage, and processing of personal data gathered via our QR digital dining platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-ivory">2. Data We Collect &amp; Why</h2>
            <p>We adhere to strict data minimisation principles:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Phone Number:</strong> Collected solely to initiate Safaricom M-Pesa STK Push payment prompts via our regulated payment gateway (IntaSend) and to deliver electronic transaction receipts.
              </li>
              <li>
                <strong>Guest Name (Optional):</strong> Used to address your order ticket accurately at tables, rooms, or poolside loungers.
              </li>
              <li>
                <strong>Table / Room Identifier:</strong> Resolved from the physical QR token to ensure prompt food delivery to your exact seating location.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-ivory">3. Consent &amp; Lawful Processing</h2>
            <p>
              Under Section 30 of the Act, we process phone numbers exclusively based on your explicit consent 
              obtained via the checkbox at checkout. You are under no obligation to provide your phone number if paying 
              via "Pay at Table" using cash or physical POS terminal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-crown-navy dark:text-crown-ivory">4. Retention &amp; Right to Erasure</h2>
            <p>
              Guest phone numbers and digital order records are automatically purged or anonymised after 
              <strong>90 days</strong> (configurable by property management within legal limits). Guests have the 
              statutory right to request immediate erasure of their data by contacting:
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-[#0B1F3A]/60 border border-[#C9A227]/30 text-xs font-mono">
              Data Protection Officer: dpo@crownhotels.co.ke<br />
              Office of the Data Protection Commissioner (ODPC) Registration: ODPC/REG/CRN-2024
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
