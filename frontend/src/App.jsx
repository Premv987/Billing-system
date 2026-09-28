import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BillingCounter from './pages/BillingCounter';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';

export default function App() {
  const [currentTab, setTab] = useState('billing'); // Default directly to fast billing counter

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060e20] text-slate-100">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setTab={setTab} />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'dashboard' && (
          <Dashboard 
            onNavigate={(tab) => setTab(tab)}
            onNewSale={() => setTab('billing')} 
            onStockIn={() => setTab('inventory')} 
          />
        )}
        {currentTab === 'billing' && <BillingCounter />}
        {currentTab === 'inventory' && <Inventory />}
        {currentTab === 'sales' && <Sales />}
      </main>
    </div>
  );
}
