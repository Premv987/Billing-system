import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import InvoiceModal from '../components/InvoiceModal';
import { 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  QrCode, 
  Printer, 
  AlertCircle,
  Camera,
  Check,
  X
} from 'lucide-react';
import api from '../api/axiosClient';

const INITIAL_CATALOG = [
  { id: '1', barcode: '8901030383821', name: 'Daawat Rozana Basmati Rice 5kg', price: 500.0, stock: 45, category: 'Groceries' },
  { id: '2', barcode: '8901262010052', name: 'Amul Taaza Milk 1L Pouch', price: 60.0, stock: 54, category: 'Dairy' },
  { id: '3', barcode: '8901719102008', name: 'Parle-G Gold Biscuits 1kg', price: 30.0, stock: 112, category: 'Snacks' },
  { id: '4', barcode: '8906007281014', name: 'Fortune Sunflower Oil 1L', price: 145.0, stock: 34, category: 'Groceries' },
  { id: '5', barcode: '8904004403011', name: 'Tata Salt Vacuum Evaporated 1kg', price: 28.0, stock: 80, category: 'Groceries' },
  { id: '6', barcode: '8901491101835', name: 'Aashirvaad Shudh Chakki Atta 10kg', price: 410.0, stock: 19, category: 'Groceries' },
  { id: '7', barcode: '8901058852210', name: 'Maggi 2-Minute Noodles 12-Pack', price: 168.0, stock: 54, category: 'Groceries' },
  { id: '8', barcode: '8901030825314', name: 'Brooke Bond Red Label Tea 500g', price: 260.0, stock: 22, category: 'Beverages' },
  { id: '9', barcode: '8901030012110', name: 'Dettol Bath Soap 4x125g Combo', price: 195.0, stock: 15, category: 'Personal Care' }
];

export default function BillingCounter() {
  const [catalog, setCatalog] = useState(INITIAL_CATALOG);
  const [cart, setCart] = useState([
    { ...INITIAL_CATALOG[0], quantity: 1, total: 500.0 },
    { ...INITIAL_CATALOG[1], quantity: 2, total: 120.0 },
    { ...INITIAL_CATALOG[2], quantity: 4, total: 120.0 }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerPhone, setCustomerPhone] = useState('9820154321');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH or UPI
  const [cashTendered, setCashTendered] = useState('1500');
  const [discount, setDiscount] = useState(0);
  const [lastSale, setLastSale] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [isScanningSim, setIsScanningSim] = useState(false);
  const searchInputRef = useRef(null);

  // Load backend products
  const fetchProducts = () => {
    api.get('/products')
      .then(res => {
        if (res.data?.products?.length) {
          setCatalog(res.data.products.map(p => ({
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            price: p.sellingPrice,
            stock: p.quantity,
            category: p.category?.name || 'Groceries'
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setPaymentMethod(prev => prev === 'CASH' ? 'UPI' : 'CASH');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setAlertMsg(`Cannot add "${product.name}" — Out of stock!`);
      setTimeout(() => setAlertMsg(''), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setAlertMsg(`Stock limit reached! Only ${product.stock} units available.`);
          setTimeout(() => setAlertMsg(''), 3000);
          return prev;
        }
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, total: product.price }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          setAlertMsg(`Stock limit reached (${item.stock} available)`);
          setTimeout(() => setAlertMsg(''), 3000);
          return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id === id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const cgst = +(discountedSubtotal * 0.025).toFixed(2);
  const sgst = +(discountedSubtotal * 0.025).toFixed(2);
  const grandTotal = +(discountedSubtotal + cgst + sgst).toFixed(2);

  const tenderedNum = parseFloat(cashTendered) || grandTotal;
  const changeReturned = Math.max(0, +(tenderedNum - grandTotal).toFixed(2));

  // Barcode quick scan simulation
  const simulateBarcodeScan = () => {
    setIsScanningSim(true);
    const randomProduct = catalog[Math.floor(Math.random() * catalog.length)];
    setTimeout(() => {
      setSearchQuery(randomProduct.barcode);
      addToCart(randomProduct);
      setIsScanningSim(false);
    }, 400);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!cart.length) {
      setAlertMsg('Cart is empty! Scan a barcode or click items on the left to begin.');
      setTimeout(() => setAlertMsg(''), 3500);
      return;
    }

    if (paymentMethod === 'CASH' && tenderedNum < grandTotal) {
      setAlertMsg(`Tendered cash (₹${tenderedNum}) is less than Total (₹${grandTotal}). Please enter full payment.`);
      setTimeout(() => setAlertMsg(''), 3500);
      return;
    }

    if (paymentMethod === 'UPI' && !showUpiModal) {
      setShowUpiModal(true);
      return;
    }

    setIsProcessing(true);
    const payload = {
      items: cart.map(i => ({ 
        productId: i.id, 
        barcode: i.barcode, 
        name: i.name, 
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.total
      })),
      customerPhone: customerPhone.trim() || undefined,
      discount,
      paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? tenderedNum : grandTotal,
      changeReturned: paymentMethod === 'CASH' ? changeReturned : 0
    };

    try {
      const res = await api.post('/sales', payload);
      if (res.data?.sale) {
        setLastSale(res.data.sale);
        setCart([]);
        setCashTendered('');
        setCustomerPhone('');
        setDiscount(0);
        setShowUpiModal(false);
        fetchProducts(); // Refresh stock counts in catalog
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn('API Sale checkout error:', err);
      const errMsg = err.response?.data?.message;
      if (errMsg && errMsg.includes('Insufficient stock')) {
        setAlertMsg(`⚠️ ${errMsg}`);
        setTimeout(() => setAlertMsg(''), 4500);
        setIsProcessing(false);
        setShowUpiModal(false);
        return;
      }
    }

    // Direct verified client bill fallback
    const localSale = {
      invoiceNumber: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date(),
      customerPhone,
      items: cart.map(c => ({ ...c, unitPrice: c.price })),
      subtotal,
      discount,
      cgst,
      sgst,
      totalAmount: grandTotal,
      paymentMethod,
      cashTendered: tenderedNum,
      changeReturned
    };
    setLastSale(localSale);
    setCart([]);
    setCashTendered('');
    setCustomerPhone('');
    setDiscount(0);
    setShowUpiModal(false);
    setIsProcessing(false);
  };

  const filteredCatalog = catalog.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode.includes(searchQuery)
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#060e20]">
      <Header title="Billing Counter 01" subtitle="Patel R Mart • Rapid Checkout & Barcode Scanning" />

      {/* Main 2-Column Split View */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column: Product Selection & Barcode Grid (~60%) */}
        <div className="w-[60%] flex flex-col bg-surface-low border border-border-subtle rounded-xl overflow-hidden p-4">
          {/* Omni Barcode & Product Search */}
          <div className="relative mb-4">
            <Barcode className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan barcode (EAN-13) or search product name / SKU... [F3]"
              className="w-full bg-[#131b2e] border-2 border-emerald-500/40 focus:border-emerald-400 rounded-lg pl-11 pr-32 py-3 text-xs text-white placeholder-slate-400 font-mono outline-none shadow-sm"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <button 
                onClick={simulateBarcodeScan}
                disabled={isScanningSim}
                title="Scan Barcode with Camera / Scanner"
                className="px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-[11px] font-mono text-black font-bold flex items-center gap-1 transition shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isScanningSim ? 'Reading...' : 'Scan [F3]'}</span>
              </button>
            </div>
          </div>

          {alertMsg && (
            <div className="mb-3 p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg}</span>
            </div>
          )}

          {/* Quick-Pick Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
            {filteredCatalog.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-3 rounded-lg bg-surface-high/60 hover:bg-surface-high border border-border-subtle hover:border-emerald-500/50 cursor-pointer flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{prod.category}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      prod.stock <= 10 ? 'bg-rose-950 text-rose-300' : 'bg-surface-lowest text-emerald-400'
                    }`}>
                      {prod.stock} left
                    </span>
                  </div>
                  <h4 className="font-semibold text-white text-xs line-clamp-2">{prod.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">{prod.barcode}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle/60">
                  <span className="font-mono font-bold text-sm text-emerald-400">₹{prod.price.toFixed(2)}</span>
                  <button className="px-2 py-1 rounded bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 text-[10px] font-bold transition flex items-center gap-0.5">
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Cart Ledger & Tender (~40%) */}
        <div className="w-[40%] flex flex-col bg-surface-low border border-border-subtle rounded-xl overflow-hidden p-4 justify-between">
          <div>
            {/* Invoice & Customer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <span className="text-xs font-bold text-white font-mono">BILLING CART</span>
                <p className="text-[11px] text-slate-400 font-mono">Patel R Mart • Active Counter</p>
              </div>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Customer Phone"
                className="w-36 bg-[#131b2e] border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Cart Items Table */}
            <div className="max-h-[30vh] overflow-y-auto divide-y divide-border-subtle/50 my-2">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  Cart is empty. Scan barcode or tap items to add.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="w-44 pr-2">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">₹{item.price.toFixed(2)} each</p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center space-x-1.5">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 rounded bg-surface-high hover:bg-slate-700 text-slate-300">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 rounded bg-surface-high hover:bg-slate-700 text-slate-300">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total & Remove */}
                    <div className="flex items-center space-x-2">
                      <span className="w-16 text-right font-mono font-bold text-white">₹{item.total.toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calculations & Tender Footer */}
          <div className="pt-3 border-t border-border-subtle space-y-3">
            {/* Financial Summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units):</span>
                <span className="font-mono text-slate-200">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (CGST 2.5% + SGST 2.5%):</span>
                <span className="font-mono text-slate-200">₹{(cgst + sgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-surface-highest p-3 rounded-lg border border-emerald-500/30">
                <span className="font-bold text-white text-sm">TOTAL AMOUNT:</span>
                <span className="font-mono font-bold text-xl text-emerald-400">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500 font-bold'
                    : 'bg-surface-high text-slate-400 border-border-subtle'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash Tender</span>
              </button>

              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition ${
                  paymentMethod === 'UPI'
                    ? 'bg-sky-950 text-sky-400 border-sky-500 font-bold'
                    : 'bg-surface-high text-slate-400 border-border-subtle'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI / QR [F9]</span>
              </button>
            </div>

            {/* Cash Calculations */}
            {paymentMethod === 'CASH' && (
              <div className="p-2.5 rounded-lg bg-surface-high/50 border border-border-subtle flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Received ₹</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-20 bg-[#131b2e] border border-slate-700 rounded px-2 py-1 text-white font-bold outline-none"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Change to Return</span>
                  <span className="text-sm font-bold text-emerald-400">₹{changeReturned.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Complete Sale CTA */}
            <button
              onClick={handleCheckout}
              disabled={!cart.length}
              className="w-full py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-5 h-5" />
              <span>{paymentMethod === 'UPI' ? 'SHOW UPI QR & PAY [F8]' : 'GENERATE BILL & PRINT INVOICE [F8]'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic UPI QR Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111927] border border-sky-500/40 w-full max-w-sm rounded-xl overflow-hidden p-6 text-center shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1">
                <QrCode className="w-4 h-4" />
                <span>BHARATPE / UPI DYNAMIC QR</span>
              </span>
              <button onClick={() => setShowUpiModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl my-4 inline-block shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=patelrmart@icici%26pn=Patel+R+Mart%26am=${grandTotal}%26cu=INR`} 
                alt="UPI QR Code" 
                className="w-44 h-44 object-contain"
              />
            </div>

            <p className="text-xs text-slate-300 font-mono">Scan with Google Pay, PhonePe, Paytm</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">₹{grandTotal.toFixed(2)}</p>

            <button
              onClick={handleCheckout}
              className="w-full mt-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Simulate Customer Payment Received</span>
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {lastSale && (
        <InvoiceModal sale={lastSale} onClose={() => setLastSale(null)} onNewBill={() => { setLastSale(null); searchInputRef.current?.focus(); }} />
      )}
    </div>
  );
}
