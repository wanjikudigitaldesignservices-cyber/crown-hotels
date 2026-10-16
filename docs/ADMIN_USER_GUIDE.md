# Crown Hotels Kenya — Admin Dashboard User Guide

Welcome to the Crown Hotels Digital Menu Management System. This guide provides step-by-step instructions for food & beverage managers, front office staff, and property supervisors.

---

## 1. Accessing the Admin Dashboard

- **URL**: Navigate to `/admin` on your workstation or tablet browser.
- **Login**: Enter your staff email (e.g. `admin@crownhotels.co.ke`) and authorized password.
- **Role Permissions**: The system adjusts your navigation bar based on your assigned role (`owner`, `manager`, `kitchen`, `waiter`, or `front_desk`).

---

## 2. Menu Management & Instant Availability Toggles

### Marking an Item "Sold Out" (86ing)
1. Go to the **Menu Items** tab.
2. Locate the dish using the search bar or category filter.
3. Click the **Toggle Availability** button.
4. *Effect is instantaneous*: The guest menu will immediately grey out the dish and display a "Sold Out / Imeisha" banner, preventing new orders.

### Adding or Editing Menu Items
1. Click **+ Add Menu Item** or click **Edit** on an existing dish.
2. Complete both English and Kiswahili fields side-by-side:
   - **Title**: (e.g., `Samaki wa Kupaka` / `Samaki wa Kupaka wa Nazi`)
   - **Description**: Detailed ingredients and culinary presentation.
   - **Price**: Enter whole Kenyan Shillings (e.g., `1850`).
   - **Daypart Schedule**: Assign to specific hours (e.g. Breakfast 06:00–11:00) or leave empty for all-day dining.
   - **Dietary & Allergens**: Select Halal, Vegetarian, Vegan, Gluten-Free, Dairy-Free, or Nut-Free badges.
3. Click **Save Changes**.

### Bulk Price Adjustments
1. In the **Menu Items** tab, click **Bulk Tools**.
2. Select your scope: Entire Property, Specific Outlet, or Specific Category.
3. Choose **Percentage Change** (e.g. `+5%` or `-10%`) or **Fixed Amount** (e.g. `+KES 100`).
4. Click **Apply Adjustment**. All prices are instantly re-indexed and an immutable record is logged to the Audit Trail.

---

## 3. QR Token Management & Table Tent Generation

1. Navigate to the **Service Points & QR** tab.
2. View all assigned tables, poolside loungers, bar stools, and hotel rooms.
3. **Regenerating a Token**: If a table QR code is compromised or vandalized, click **Revoke & Regenerate**. A new 128-bit unguessable token is generated immediately, invalidating the old QR.
4. **Printable Table Tents**:
   - Click **Generate A4 Table Tents**.
   - The system formats a print-ready A4 PDF with Crown Hotels branding, the high-contrast QR code, table number, and instructions for M-Pesa payments.
   - Print, laminate, and place on the dining table.

---

## 4. Sales Reports & Financial Insights

- Click **Reports** to analyze live property metrics:
  - **Daily Revenue & Average Order Value (AOV)**
  - **Hourly Order Velocity**: Identify peak lunch (12:30–14:00) and dinner rushes.
  - **Payment Breakdown**: Monitor M-Pesa STK push vs. Pay at Table vs. Room Charge.
  - **Top Sellers**: Fast-moving Kenyan favorites (e.g., Nyama Choma, Tilapia, Dawa).
  - **CSV Export**: Download clean accounting exports compatible with QuickBooks, Sage, or Micros Fidelio.

---

## 5. Audit Log & Security Compliance

- Click **Audit Trail** to inspect administrative history.
- Every price update, item addition, availability change, or role modification logs:
  - Timestamp in `Africa/Nairobi` timezone.
  - Staff member email and IP address.
  - Exact Before & After JSON payload changes.
