import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { 
  ScanLine, 
  PackagePlus, 
  Boxes, 
  ReceiptText, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  Clock,
  IndianRupee,
  Layers
} from 'lucide-react';
import api from '../api/axiosClient';

export default function Dashboard({ onNavigate, onNewSale, onStockIn }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [summary, setSummary] = useState({
    todaySales: 2497.96,
    billsCount: 3,
    lowStockCount: 2
  });
  const [lowStockItems, setLowStockItems] = useState([]);

  // Load products for quick price & stock lookup
  useEffect(() => {
    api.get('/products')
      .then(res => {
        if (res.data?.products) {
          setAllProducts(res.data.products);
          const low = res.data.products.filter(p => p.quantity <= p.minimumStock);
          setLowStockItems(low);
        }
      })
      .catch(() => {});

    api.get('/dashboard/stats')
      .then(res => {
        if (res.data?.stats) {
          setSummary({
            todaySales: res.data.stats.todaySales || 0,
            billsCount: res.data.stats.transactionsCount || 0,
            lowStockCount: res.data.stats.lowStockCount || 0
          });
        }
      })
      .catch(() => {});
  }, []);

  // Filter products as the user scans or types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.barcode.includes(q) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q))
    ).slice(0, 4);
    setSearchResults(matches);
  }, [searchQuery, allProducts]);

  const nav = (tab) => {
    if (onNavigate) onNavigate(tab);
    else if (tab === 'billing' && onNewSale) onNewSale();
    else if (tab === 'inventory' && onStockIn) onStockIn();
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface-lowest">
      <Header 
        title="Store Operations Hub" 
        subtitle="Patel R Mart, Titwala (E) • Daily Store Management & Quick Tools" 
      />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Store Status Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-surface-low to-surface-low border border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Patel R Mart • Store Active</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                  OPEN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Counter 01 Ready • Thermal Printer Synced • Automatic Stock Deduction Active
              </p>
            </div>
          </div>

          {/* Clean 3-Item Store Status (Non-annoying summary) */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-surface-high border border-border-subtle text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Today's Sales</p>
              <p className="text-sm font-bold font-mono text-emerald-400">
                ₹{Number(summary.todaySales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-surface-high border border-border-subtle text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Bills</p>
              <p className="text-sm font-bold font-mono text-white">
                {summary.billsCount} Bills
              </p>
            </div>
            {summary.lowStockCount > 0 && (
              <button 
                onClick={() => nav('inventory')}
                className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/50 text-left transition"
              >
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">Needs Restock</p>
                <p className="text-sm font-bold font-mono text-amber-300">
                  {summary.lowStockCount} Items ⚠️
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Feature 1: Instant Price & Stock Checker (Super Practical) */}
        <div className="p-6 rounded-2xl bg-surface-low border border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Instant Price & Stock Checker</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Scan barcode or type item name to check instant shelf stock & price
            </span>
          </div>

          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Scan barcode or type 'Amul Milk', 'Sugar', 'Rice'..."
              className="w-full pl-11 pr-4 py-3 bg-surface-high border border-border-subtle rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Result Cards */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {searchResults.map((item) => {
                const isLow = item.quantity <= item.minimumStock;
                return (
                  <div key={item.id} className="p-3.5 rounded-xl bg-surface-high/60 border border-border-subtle flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Barcode: {item.barcode} • {item.category?.name || 'General'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-mono text-emerald-400">
                        ₹{item.sellingPrice.toFixed(2)}
                      </p>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded inline-block mt-0.5 ${
                        isLow 
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40' 
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {item.quantity} in stock {isLow && '⚠️'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-slate-500 font-mono text-center py-2">
              No matching item found in store catalog.
            </p>
          )}
        </div>

        {/* Feature 2: Quick Store Launchpad (4 Direct Operations) */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            Quick Store Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Action 1: Open Billing */}
            <div 
              onClick={() => nav('billing')}
              className="p-5 rounded-2xl bg-surface-low hover:bg-surface-high border border-border-subtle hover:border-emerald-500/50 cursor-pointer transition group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0">
                <ScanLine className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                    Start New Customer Bill
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 bg-surface-high px-2 py-0.5 rounded">
                    Shortcut F12
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Scan items with barcode gun, apply discounts, collect Cash/UPI, and print receipt.
                </p>
                <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1 mt-3">
                  Open Billing Counter <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>

            {/* Action 2: Receive Stock */}
            <div 
              onClick={() => nav('inventory')}
              className="p-5 rounded-2xl bg-surface-low hover:bg-surface-high border border-border-subtle hover:border-sky-500/50 cursor-pointer transition group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition shrink-0">
                <PackagePlus className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm group-hover:text-sky-400 transition">
                    Receive Inward Stock
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 bg-surface-high px-2 py-0.5 rounded">
                    Stock-In
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Record inward delivery challans from distributors and update shelf quantities.
                </p>
                <span className="text-xs text-sky-400 font-semibold inline-flex items-center gap-1 mt-3">
                  Go to Stock-In Drawer <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>

            {/* Action 3: Product Inventory */}
            <div 
              onClick={() => nav('inventory')}
              className="p-5 rounded-2xl bg-surface-low hover:bg-surface-high border border-border-subtle hover:border-indigo-500/50 cursor-pointer transition group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition">
                  Manage Products Catalog
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Add new items, update selling prices, barcodes, and minimum stock alerts.
                </p>
                <span className="text-xs text-indigo-400 font-semibold inline-flex items-center gap-1 mt-3">
                  View Full Inventory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>

            {/* Action 4: Sales Invoices */}
            <div 
              onClick={() => nav('sales')}
              className="p-5 rounded-2xl bg-surface-low hover:bg-surface-high border border-border-subtle hover:border-teal-500/50 cursor-pointer transition group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition shrink-0">
                <ReceiptText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm group-hover:text-teal-400 transition">
                  Past Sales & Receipts
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Search past invoices by bill number or phone, reprint tax receipts, and audit history.
                </p>
                <span className="text-xs text-teal-400 font-semibold inline-flex items-center gap-1 mt-3">
                  View Sales Register <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature 3: Actionable Restock Notice (Only when items need reorder) */}
        {lowStockItems.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                  Items Requiring Supplier Reorder
                </h4>
              </div>
              <button 
                onClick={() => nav('inventory')}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono font-semibold flex items-center gap-1"
              >
                Open Restock Screen &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-surface-high/70 border border-amber-800/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Current: <strong className="text-rose-400">{item.quantity} units</strong> • Minimum Buffer: {item.minimumStock}
                    </p>
                  </div>
                  <button 
                    onClick={() => nav('inventory')}
                    className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-700/50 text-amber-300 text-[11px] font-mono transition"
                  >
                    + Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
