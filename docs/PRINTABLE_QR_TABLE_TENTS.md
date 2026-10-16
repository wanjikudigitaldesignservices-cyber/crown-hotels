# Crown Hotels Kenya — QR Table Tent Production Guide

This document provides specifications for generating, printing, and maintaining physical QR table tents across Crown Hotels properties.

---

## 1. Specifications & Materials

- **Format**: Standard A4 folded to A5 tent (double-sided) or acrylic stand inserts (105mm × 148mm).
- **Paper Stock**: 350 GSM Silk Artboard with Matte Anti-Scratch Lamination.
- **Color Palette**: Deep Navy (`#0B1F3A`) background with Crown Gold (`#C9A227`) crown monogram, crisp white typography (`#FAF6EC`), and high-contrast black/white QR matrix with a 4-module quiet zone.

---

## 2. Seeded Service Points & Unguessable QR Tokens

| Outlet | Service Point | Token (128-bit Unguessable) | Live URL |
|---|---|---|---|
| **The Sovereign Restaurant** | Table 1 | `crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc` | `http://localhost:5173/m/crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc` |
| **The Sovereign Restaurant** | Table 2 | `crn_tbl_9a4b8c7d6e5f1029384756abcdef0123` | `http://localhost:5173/m/crn_tbl_9a4b8c7d6e5f1029384756abcdef0123` |
| **The Sovereign Restaurant** | Table 3 | `crn_tbl_1f2e3d4c5b6a7980fedcba9876543210` | `http://localhost:5173/m/crn_tbl_1f2e3d4c5b6a7980fedcba9876543210` |
| **The Sovereign Restaurant** | Table 4 | `crn_tbl_5e6d7c8b9a0f123456789abcdef04821` | `http://localhost:5173/m/crn_tbl_5e6d7c8b9a0f123456789abcdef04821` |
| **Crown Safari Bar & Lounge** | Bar Stool 1 | `crn_bar_7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f` | `http://localhost:5173/m/crn_bar_7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f` |
| **Crown Safari Bar & Lounge** | Bar Table 4 | `crn_bar_2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e` | `http://localhost:5173/m/crn_bar_2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e` |
| **Poolside Oasis & Bar** | Lounger 12 | `crn_pls_3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f` | `http://localhost:5173/m/crn_pls_3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f` |
| **Crown In-Room Dining** | Room 402 | `crn_rom_4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a` | `http://localhost:5173/m/crn_rom_4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a` |

---

## 3. Automated In-App Printing

1. Open the Admin Dashboard at `/admin`.
2. Go to the **Service Points** tab.
3. Click the **Print Table Tents** button.
4. The application opens the browser print dialog with print-optimized CSS media queries (`@media print`):
   - Suppresses navigation bars and sidebar menus.
   - Positions the Crown Hotels logo, property name, high-resolution QR matrix, and step-by-step guest instructions (*"Scan with Camera"*, *"Browse Menu"*, *"Pay with M-Pesa"*).
   - Generates 1 page per service point.
