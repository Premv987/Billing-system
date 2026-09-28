# Patel R Mart — Inventory & Billing Management System
**Community Engagement Project (CEP) • Academic Year 2026–27**  
**Community Partner:** Patel R Mart, Station Road, Titwala (E), Thane - 421605  
**Project Category:** Web-Based Retail Billing & Checkout, Real-Time Inventory & Accounting System  

---

## 📌 Project Overview

This full-stack enterprise web application replaces manual paper registers and slow desktop billing with an automated, high-speed, centralized digital platform built specifically for **Patel R Mart, Titwala (E)**.

### Key Objectives
* ⚡ **Sub-Second Billing:** Barcode scanning (EAN-13), keyboard hotkeys (`F3` search, `F8` print, `F9` UPI, `F12` settle), and 1-click grocery tiles.
* 📦 **Atomic Inventory Updates:** Automatic inventory reduction upon sale completion within database transactions (ACID compliant).
* ⚠️ **Low-Stock Early Warning:** Automatic detection of inventory falling below safety thresholds (e.g. Rice < 20 bags, Milk < 25 pouches).
* 🧾 **Supermarket Tax Invoice Generation:** Digital and printable 80mm thermal cash memos with GSTIN (`27AABCP9912Q1ZX`), itemized tax breakdown (CGST/SGST 2.5%), barcode, and WhatsApp e-Bill integration.
* 📊 **Executive Dashboard:** Real-time visibility into today's sales (₹25,450 / 124 bills), essential figures: gross revenue, total invoices, average bill size, items sold, physical stock units, and tender settlements.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Single Page Application with instantaneous hot-reloading |
| **Styling** | Tailwind CSS | High-contrast terminal dark mode (`#0b1326`) with emerald & cyan accents |
| **Icons** | Lucide React | High-legibility supermarket UI icons |
| **API Client** | Axios | REST client with JWT token interceptors |
| **Backend API** | Node.js + Express.js | Modular RESTful architecture with CORS & validation |
| **ORM** | Prisma ORM | Type-safe database queries and automated migrations |
| **Database** | SQLite (Default Dev) / PostgreSQL (Prod) | Relational schema enforcing foreign keys and transaction rollbacks |
| **Authentication**| JWT + bcryptjs | Secure password hashing and role-based authorization (`ADMIN`, `STAFF`) |

---

## 📁 Project Directory Structure

```text
Patel-R-Mart-Billing-System/
├── README.md                      # Comprehensive project guide & viva prep
├── package.json                   # Root orchestrator scripts
├── backend/                       # Node.js + Express REST API
│   ├── .env                       # Environment variables (PORT, JWT_SECRET, DATABASE_URL)
│   ├── package.json               # Backend dependencies
│   ├── prisma/
│   │   ├── schema.prisma          # Relational Prisma schema (7 models)
│   │   └── seed.js                # Realistic seed script (FMCG products, users, suppliers)
│   └── src/
│       ├── server.js              # Express app bootstrap & middleware
│       ├── middleware/
│       │   └── auth.js            # JWT auth & Admin RBAC verification
│       └── routes/
│           ├── auth.routes.js     # /api/auth/login, /api/auth/me
│           ├── products.routes.js # /api/products, barcode search, CRUD
│           ├── inventory.routes.js# /api/inventory/stock-in, adjust, low-stock
│           ├── sales.routes.js    # /api/sales (Atomic checkout transaction)
│           ├── dashboard.routes.js# /api/dashboard/stats
│           ├── categories.routes.js
│           └── suppliers.routes.js
└── frontend/                      # React + Vite + Tailwind CSS
    ├── index.html                 # App shell with Inter & JetBrains Mono fonts
    ├── vite.config.js             # Dev server & /api proxy to port 5000
    ├── tailwind.config.js         # Custom retail dark theme tokens
    └── src/
        ├── App.jsx                # Main controller & navigation router
        ├── main.jsx               # React DOM entrypoint
        ├── index.css              # Global styles & @media print thermal styles
        ├── api/
        │   └── axiosClient.js     # Axios client with auth header interceptor
        ├── context/
        │   └── AuthContext.jsx    # Session management & user roles
        ├── components/
        │   ├── Sidebar.jsx        # Persistent store sidebar with status badge
        │   ├── Header.jsx         # Live date/time clock, status pill, New Sale CTA
        │   └── InvoiceModal.jsx   # 80mm printable supermarket tax invoice
        └── pages/
            ├── Login.jsx          # Secure login with 1-click test roles
            ├── Dashboard.jsx      # Essential figures (Sales, Invoices, Basket Size, Units, Stock Buffers)
            ├── BillingCounter.jsx            # High-speed barcode scanning & cash/UPI tender
            ├── Inventory.jsx      # 1,250 SKU catalog & Quick Stock-In drawer
            └── Sales.jsx          # Transaction audit register & invoice reprint
```

---

## ⚡ Quick Start Guide

### Step 1: Install Dependencies
Open two terminals in the project folder:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

---

### Step 2: Initialize & Seed Database
In your backend terminal:
```bash
cd backend
npx prisma db push
node prisma/seed.js
```

This automatically generates the database and populates it with:
* **Admin Login:** `admin@patelrmart.com` / `admin123`
* **Cashier Login:** `rahul@patelrmart.com` / `staff123`
* **7 Product Categories:** Groceries, Dairy & Bakery, Edible Oils, Snacks, Beverages, Household, Personal Care
* **5 FMCG Suppliers:** Mahalaxmi Wholesalers, Amul Direct, Parle Agro, Tata Consumer, Adani Wilmar
* **Realistic Products with EAN-13 Barcodes:** Basmati Rice (8901030383821), Amul Milk (8901262010052), Fortune Sunflower Oil (8906007281014), Parle-G Gold (8901719102008), Tata Salt (8904004403011), etc.

---

### Step 3: Run the Application

**Start Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Start Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## 🎯 CEP Project Evaluation & Viva Highlights

When presenting this project for evaluation:
1. **Community Problem Solved:** Patel R Mart in Titwala (E) historically suffered from manual billing bottlenecks during evening rush hours (17:00–20:00), inventory stockouts of staples, and math errors in GST / discount calculations.
2. **Speed & Ergonomics:** Cashiers can execute bills completely via keyboard without touching the mouse (`F3` search, `F9` toggle UPI, `F8` print bill).
3. **Database Integrity (ACID):** Demonstrate how `backend/src/routes/sales.routes.js` wraps bill creation and inventory deduction in a single Prisma transaction—if stock is insufficient, the transaction rolls back cleanly without inconsistent data.
4. **GST Compliance:** Automated calculation of CGST (2.5%) and SGST (2.5%) with store GSTIN printed on tax invoices.
