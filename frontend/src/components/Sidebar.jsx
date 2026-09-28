import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  ScanLine, 
  Boxes, 
  ReceiptText, 
  Users, 
  BarChart3, 
  Settings, 
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab }) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'ALL' },
    { id: 'billing', label: 'Billing Counter', icon: ScanLine, hotkey: 'F12', role: 'ALL' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, badge: '1,250', role: 'ADMIN' },
    { id: 'sales', label: 'Sales & Invoices', icon: ReceiptText, role: 'ALL' },
  ];

  return (
    <aside className="w-64 bg-surface-lowest border-r border-border-subtle flex flex-col justify-between shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-border-subtle flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
              Patel R Mart
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Titwala (E) • Store #01</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-surface-high text-emerald-400 border-l-4 border-emerald-500 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-surface-low'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.hotkey && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-lowest text-slate-400 border border-border-subtle">
                    {item.hotkey}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card & System Sync */}
      <div className="p-3 border-t border-border-subtle bg-surface-lowest/60">
        <div className="p-2.5 rounded-xl bg-surface-low border border-border-subtle mb-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              P
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Mr. Patel (Owner / Admin)'}</p>
              <span className="inline-flex items-center text-[10px] font-mono text-emerald-400">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Terminal 01 • Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>Counter Sync: Active</span>
          <span>v2.6 CEP</span>
        </div>
      </div>
    </aside>
  );
}
