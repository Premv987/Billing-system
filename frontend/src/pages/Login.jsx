import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@patelrmart.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
    setLoading(false);
  };

  const setCredentials = (role) => {
    if (role === 'ADMIN') {
      setEmail('admin@patelrmart.com');
      setPassword('admin123');
    } else {
      setEmail('rahul@patelrmart.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-[#060e20] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b1326] border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-emerald-400 mb-3">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patel R Mart</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Titwala (E) • Inventory & Billing System</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            CEP Academic Year 2026–27
          </span>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="staff@patelrmart.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Roles Quick Pick */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 mb-2 font-mono">Quick 1-Click Demo Login:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCredentials('ADMIN')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-surface-low hover:bg-surface-high border border-border-subtle text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 font-mono transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin / Owner</span>
            </button>
            <button
              onClick={() => setCredentials('STAFF')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-surface-low hover:bg-surface-high border border-border-subtle text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 font-mono transition"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Billing Cashier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
