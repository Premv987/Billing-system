import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Clock, Wifi } from 'lucide-react';

export default function Header({ title, subtitle, onNewSale }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-surface-lowest border-b border-border-subtle px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Status Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-low border border-border-subtle text-xs font-mono text-slate-300">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Online • 28ms</span>
          <span className="text-slate-600">|</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Notifications */}
        <div className="relative cursor-pointer p-2 rounded-md hover:bg-surface-low text-slate-400 hover:text-white transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
        </div>

        {/* Quick Sale CTA */}
        {onNewSale && (
          <button
            onClick={onNewSale}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-1.5 rounded text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale [F12]</span>
          </button>
        )}
      </div>
    </header>
  );
}
