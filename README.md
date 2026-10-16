# Crown Hotels Kenya — Production Digital Menu Platform

A production digital guest menu and staff platform built for **Crown Hotels**, a premier hospitality group operating in Kenya. Guests scan a secure, unguessable QR code at a dining table, poolside lounger, cocktail bar, or hotel room to browse a visual bilingual menu and order. Hotel staff manage orders, menu availability, dayparts, pricing, and live kitchen operations from an admin dashboard.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend & Data Store**: Supabase (PostgreSQL 15, Row Level Security, Supabase Storage, Realtime broadcast channels, Edge Functions).
- **Payment Processing**: IntaSend M-Pesa STK Push integration with HMAC-SHA256 signature verification and replay-safe webhooks.
- **Media Pipeline**: Sharp image processing pipeline generating responsive WebP variants (`1200w`, `800w`, `400w`) under 140 KB with non-empty accessibility alt text.
- **Design System**: Bespoke luxury African hospitality theme (*Deep Navy* `#0B1F3A`, *Crown Gold* `#C9A227`, *Ivory* `#FAF6EC`, *Savanna Terracotta* `#B4532A`, *Charcoal* `#1C1C1C`).

---

## 2. Key Kenyan Market Realities Handled

1. **Currency**: Kenyan Shillings (KES) stored as whole integers, formatted as `KES 1,850`. Optional live USD conversion for international guests (configurable admin exchange rate, default 130).
2. **Mobile-First & Bandwidth Conscious**: Initial gzipped JavaScript bundle is **165.64 kB** (well within the < 250 kB target). All images are lazy-loaded responsive WebP files (< 140 KB), optimized for Kenyan 3G/4G cellular networks.
3. **M-Pesa STK Push Payments**: Supports `07xx`, `01xx`, `+2547xx`, and `+2541xx` phone numbers, normalized server-side to `+254...`. Guest also has options for "Pay at Table" and "Charge to Room".
4. **Timezone & Daypart Engine**: Operates in `Africa/Nairobi`. Dynamic dayparts automatically schedule menu availability (e.g., Breakfast 06:00–11:00, Grill & Mains 11:30–23:00, Bar & Alcohol 12:00–02:00).
5. **Bilingual Kenyan Experience**: Seamless English and Kiswahili toggle (`EN` / `SW`) across all UI controls, search terms, dietary badges, and menu descriptions.
6. **Alcohol 18+ Age Confirmation Gate**: Mandatory date-of-birth / age confirmation gate before any beer, wine, or cocktail categories can be viewed or ordered.
7. **Kenya Data Protection Act 2019 Compliance**: Explicit consent checkbox when collecting guest phone numbers, strict minimal data capture, configurable 90-day retention purge, and a public `/privacy` policy page.
8. **Kenyan-First Cuisine**: Extensive authentic culinary catalog featuring Nyama Choma, Whole Fried Lake Victoria Tilapia, Mukimo with Beef Stew, Swahili Beef Biryani, Samaki wa Kupaka, Mshikaki Skewers, Kenyan Mutura, Viazi Karai, Kienyeji Greens (Managu & Terere), Mandazi, Kenyan Chai, and Dawa Cocktails.

---

## 3. Zero Trust Security Model

- **Never Trust the Client**: Prices, item availability, taxes, and service charges are 100% recomputed server-side during order submission. Tampered client prices are rejected with `400 Bad Request`.
- **Row Level Security (RLS)**: Enabled across all 18 PostgreSQL tables. Anonymous users can only read active, non-deleted menu views and cannot directly write to `menu_items`, `orders`, `payments`, or `profiles`.
- **Role-Based Access Control**: `owner`, `manager`, `kitchen`, `waiter`, and `front_desk` roles with strict server-side validation.
- **Unguessable 128-Bit QR Tokens**: Every table, room, and lounger is provisioned with a cryptographic, revocable token (e.g. `crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc`).
- **Replay-Safe Webhooks**: IntaSend M-Pesa webhooks verify HMAC-SHA256 signatures and idempotency keys to prevent double-charging or forged transaction receipts.
- **Immutable Audit Trail**: Every administrative write, price update, and availability toggle logs `actor_id`, `action`, `entity_type`, `before/after` JSON payloads, and timestamps.

---

## 4. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# IntaSend M-Pesa Configuration
VITE_INTASEND_PUBLIC_KEY=ISPubKey_live_...
INTASEND_SECRET_KEY=ISSecretKey_live_...
INTASEND_WEBHOOK_SECRET=your-hmac-sha256-secret

# Application Settings
VITE_DEFAULT_PROPERTY_ID=a0000000-0000-0000-0000-000000000001
VITE_APP_URL=http://localhost:5173
```

---

## 5. Getting Started & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run the real food image processing pipeline
npx tsx scripts/build-image-pipeline.ts

# 3. Audit all 75 dish images for WebP format, dimensions, and size budgets
npx tsx scripts/verify-images.ts

# 4. Run automated unit & security test suite
npx vitest run

# 5. Start development server
npm run dev
```

Visit the routes:
- Guest Menu (Table 1 QR Landing): `http://localhost:5173/m/crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc`
- Admin Dashboard: `http://localhost:5173/admin`
- Kitchen Display System (KDS): `http://localhost:5173/kitchen`
- Waiter Service View: `http://localhost:5173/waiter`
- Brand & Design System: `http://localhost:5173/brand`
- Privacy Policy (KDPA 2019): `http://localhost:5173/privacy`

---

## 6. Production Build & Deployment

```bash
# Build production bundle
npm run build
```

- **Vercel Deploy**: Linked directly via GitHub repository. Preview deploys trigger on all PRs; production deploy triggers on merge to `main`.
- **Rollback Path**: Instant Vercel one-click rollback to prior deployment hash in case of upstream regressions. Database schema changes use backward-compatible migrations (`IF NOT EXISTS`, additive columns).
