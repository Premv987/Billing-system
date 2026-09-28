import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  X,
  CheckCircle2,
  PackagePlus
} from 'lucide-react';
import api from '../api/axiosClient';

const INITIAL_INVENTORY = [
  { id: '1', barcode: '8901030383821', sku: 'SKU-GR-0024', name: 'Daawat Rozana Basmati Rice 5kg', category: 'Groceries & Staples', purchasePrice: 410.0, sellingPrice: 500.0, quantity: 45, minimumStock: 20, supplier: 'Mahalaxmi Wholesalers' },
  { id: '2', barcode: '8901262010052', sku: 'SKU-DY-0012', name: 'Amul Taaza Milk 1L Pouch', category: 'Dairy & Bakery', purchasePrice: 52.0, sellingPrice: 60.0, quantity: 4, minimumStock: 25, supplier: 'Amul Direct Distributor' },
  { id: '3', barcode: '8901719102008', sku: 'SKU-SN-0088', name: 'Parle-G Gold Biscuits 1kg', category: 'Snacks & Confectionery', purchasePrice: 24.5, sellingPrice: 30.0, quantity: 112, minimumStock: 30, supplier: 'Parle Agro Agency' },
  { id: '4', barcode: '8906007281014', sku: 'SKU-EO-0045', name: 'Fortune Sunflower Oil 1L', category: 'Edible Oils & Ghee', purchasePrice: 122.0, sellingPrice: 145.0, quantity: 34, minimumStock: 15, supplier: 'Adani Wilmar Depot' },
  { id: '5', barcode: '8904004403011', sku: 'SKU-GR-0015', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Groceries & Staples', purchasePrice: 23.0, sellingPrice: 28.0, quantity: 80, minimumStock: 25, supplier: 'Tata Consumer' },
  { id: '6', barcode: '8906010500119', sku: 'SKU-GR-0099', name: 'Madhur Pure Sugar 1kg', category: 'Groceries & Staples', purchasePrice: 42.0, sellingPrice: 48.0, quantity: 4, minimumStock: 30, supplier: 'Mahalaxmi Wholesalers' }
];

export default function Inventory() {
  const [products, setProducts] = useState(INITIAL_INVENTORY);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Slide-over Drawers & Modals
  const [showStockIn, setShowStockIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_INVENTORY[0]);
  const [quantityReceived, setQuantityReceived] = useState(50);
  const [challanNo, setChallanNo] = useState('CH-2026-8841');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '20',
    minimumStock: '10'
  });

  const loadData = () => {
    api.get('/products')
      .then(res => {
        if (res.data?.products?.length) {
          setProducts(res.data.products.map(p => ({
            id: p.id,
            barcode: p.barcode,
            sku: p.sku,
            name: p.name,
            category: p.category?.name || 'Groceries & Staples',
            categoryId: p.categoryId,
            purchasePrice: p.purchasePrice,
            sellingPrice: p.sellingPrice,
            quantity: p.quantity,
            minimumStock: p.minimumStock,
            supplier: p.supplier?.name || 'Mahalaxmi Wholesalers'
          })));
        }
      })
      .catch(() => {});

    api.get('/categories')
      .then(res => { if (res.data?.categories) setCategories(res.data.categories); })
      .catch(() => {});

    api.get('/suppliers')
      .then(res => { if (res.data?.suppliers) setSuppliers(res.data.suppliers); })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantityReceived) || 0;
    if (qty <= 0) return;

    try {
      await api.post('/inventory/stock-in', {
        productId: selectedProduct.id,
        quantityReceived: qty,
        challanNumber: challanNo
      });
      loadData();
    } catch (err) {
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id ? { ...p, quantity: p.quantity + qty } : p
      ));
    }

    setShowStockIn(false);
    alert(`Stock-In Successful! Added ${qty} units to "${selectedProduct.name}".`);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.barcode) {
      alert('Please fill product name and barcode');
      return;
    }

    const payload = {
      ...newProd,
      categoryId: newProd.categoryId || (categories[0]?.id || 'cat-1'),
      supplierId: newProd.supplierId || (suppliers[0]?.id || 'sup-1'),
      sku: newProd.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000))
    };

    try {
      await api.post('/products', payload);
      loadData();
      setShowAddProduct(false);
      alert(`Product "${newProd.name}" added successfully to catalog!`);
      setNewProd({
        name: '',
        barcode: '',
        sku: '',
        categoryId: '',
        supplierId: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '20',
        minimumStock: '10'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product in database');
    }
  };

  const exportCSV = () => {
    const headers = ['Product ID', 'Barcode', 'SKU', 'Product Name', 'Category', 'Cost Price (INR)', 'Selling Price (INR)', 'Stock Quantity', 'Min Stock Threshold', 'Supplier'];
    const rows = products.map(p => [
      p.id,
      `"${p.barcode}"`,
      p.sku,
      `"${p.name}"`,
      `"${p.category}"`,
      p.purchasePrice,
      p.sellingPrice,
      p.quantity,
      p.minimumStock,
      `"${p.supplier}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patel_r_mart_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.barcode.includes(search) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const isLow = p.quantity <= p.minimumStock;
    if (statusFilter === 'LOW') return matchesSearch && isLow;
    if (statusFilter === 'IN_STOCK') return matchesSearch && !isLow;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#060e20]">
      <Header title="Inventory & Stock Management" subtitle="1,250 SKUs • Real-Time Stock Updates & Supplier Restock" />

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Main Products Grid Table */}
        <div className="flex-1 flex flex-col bg-surface-low border border-border-subtle rounded-xl overflow-hidden p-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Name, Barcode (EAN-13), SKU... [Ctrl+/]"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-surface-high p-1 rounded-lg border border-border-subtle text-xs font-mono">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'ALL' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400'}`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('LOW')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'LOW' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400'}`}
              >
                Low Stock ({products.filter(p => p.quantity <= p.minimumStock).length})
              </button>
              <button
                onClick={() => setStatusFilter('IN_STOCK')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'IN_STOCK' ? 'bg-emerald-950 text-emerald-400 font-bold' : 'text-slate-400'}`}
              >
                In Stock ({products.filter(p => p.quantity > p.minimumStock).length})
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={exportCSV}
                className="px-3 py-2 rounded-lg bg-surface-high hover:bg-slate-700 text-xs font-mono text-slate-300 border border-border-subtle flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowAddProduct(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Product</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-low z-10 border-b border-border-subtle font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">BARCODE / SKU</th>
                  <th className="py-2.5 px-3">PRODUCT NAME</th>
                  <th className="py-2.5 px-3">COST</th>
                  <th className="py-2.5 px-3">SELLING</th>
                  <th className="py-2.5 px-3">STOCK ON HAND</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {filtered.map((prod) => {
                  const isLow = prod.quantity <= prod.minimumStock;
                  return (
                    <tr key={prod.id} className="hover:bg-surface-high/30 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        <div>{prod.barcode}</div>
                        <span className="text-[10px] text-slate-500">{prod.sku}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {prod.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{prod.supplier} • {prod.category}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">₹{prod.purchasePrice.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{prod.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`font-mono font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                          {prod.quantity} units
                        </span>
                        <span className="text-[10px] text-slate-500 block">Min Level: {prod.minimumStock}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isLow
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}>
                          {isLow ? '🟡 Low Stock' : '🟢 In Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => { setSelectedProduct(prod); setShowStockIn(true); }}
                          className="px-2.5 py-1 rounded bg-surface-high hover:bg-slate-700 text-emerald-400 border border-border-subtle text-xs font-mono font-semibold transition"
                        >
                          + Receive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-over Stock-In Drawer */}
        {showStockIn && (
          <div className="w-96 bg-surface-low border border-border-subtle rounded-xl p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <h4 className="font-bold text-white text-sm">Quick Stock-In / Receive</h4>
                <button onClick={() => setShowStockIn(false)} className="text-slate-400 hover:text-white p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStockInSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Product</label>
                  <p className="font-semibold text-white text-xs">{selectedProduct.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{selectedProduct.barcode}</p>
                </div>

                <div className="p-3 rounded-lg bg-surface-highest border border-border-subtle text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Stock:</span>
                    <span className="font-bold text-white">{selectedProduct.quantity} units</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>New Stock Calc:</span>
                    <span className="font-bold">{selectedProduct.quantity + (parseInt(quantityReceived) || 0)} units</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Challan / Inv Number</label>
                  <input
                    type="text"
                    required
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Supplier</label>
                  <p className="text-xs font-mono text-slate-300 p-2 rounded bg-[#131b2e] border border-slate-700">{selectedProduct.supplier}</p>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Stock-In & Update DB</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add New Product */}
        {showAddProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111927] border border-slate-700 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <PackagePlus className="w-5 h-5" />
                  <h3 className="font-bold text-base text-white">Add New Product to Mart</h3>
                </div>
                <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Name & Weight</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Wagh Bakri Premium Tea 500g"
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Barcode (EAN-13)</label>
                    <input
                      type="text"
                      required
                      value={newProd.barcode}
                      onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                      placeholder="8901234567890"
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={newProd.sku}
                      onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                      placeholder="SKU-TEA-001"
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={newProd.categoryId}
                      onChange={(e) => setNewProd({ ...newProd, categoryId: e.target.value })}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Supplier</label>
                    <select
                      value={newProd.supplierId}
                      onChange={(e) => setNewProd({ ...newProd, supplierId: e.target.value })}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProd.purchasePrice}
                      onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })}
                      placeholder="180.00"
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProd.sellingPrice}
                      onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                      placeholder="210.00"
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Opening Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newProd.quantity}
                      onChange={(e) => setNewProd({ ...newProd, quantity: e.target.value })}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Min. Alert Level</label>
                    <input
                      type="number"
                      min="1"
                      value={newProd.minimumStock}
                      onChange={(e) => setNewProd({ ...newProd, minimumStock: e.target.value })}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 rounded-lg bg-surface-high hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold shadow"
                  >
                    Save Product to DB
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
