import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import InvoiceModal from '../components/InvoiceModal';
import { 
  Search, 
  Eye, 
  FileSpreadsheet, 
  Printer, 
  Share2, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw,
  IndianRupee,
  Receipt,
  CheckCircle2,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import api from '../api/axiosClient';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [inspectSale, setInspectSale] = useState(null);
  const [modalSale, setModalSale] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterMethod !== 'ALL') params.paymentMethod = filterMethod;
      if (filterDate !== 'ALL') params.date = filterDate;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/sales', { params });
      if (res.data?.sales) {
        setSales(res.data.sales);
        if (res.data.sales.length > 0) {
          // If current inspected sale is not in new list, pick the first one
          setInspectSale(prev => {
            if (!prev) return res.data.sales[0];
            const found = res.data.sales.find(s => s.id === prev.id);
            return found || res.data.sales[0];
          });
        } else {
          setInspectSale(null);
        }
      }
    } catch (err) {
      console.error('Failed to load sales register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 4000); // 4-second real-time sync for purchases
    const handleFocus = () => fetchSales();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [filterMethod, filterDate]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Financial summary metrics
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalGST = sales.reduce((sum, s) => sum + (s.cgst || 0) + (s.sgst || 0), 0);
  const cashSalesTotal = sales.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.totalAmount, 0);
  const upiSalesTotal = sales.filter(s => s.paymentMethod === 'UPI').reduce((sum, s) => sum + s.totalAmount, 0);

  // Robust isolated iframe thermal printing
  const handlePrint = (saleToPrint) => {
    const sale = saleToPrint || inspectSale;
    if (!sale) return;

    const receiptEl = document.getElementById('inspect-thermal-receipt');
    if (!receiptEl) {
      setModalSale(sale);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${sale.invoiceNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 74mm;
              margin: 0 auto;
              padding: 5mm 2mm;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .dashed-border { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin: 4px 0; }
            .dashed-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .dashed-top { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .solid-top { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
            .flex { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 11px; }
            th { text-align: left; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 10px; }
            td { padding: 2px 0; }
          </style>
        </head>
        <body>
          ${receiptEl.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
      }, 2000);
    }, 250);
  };

  // WhatsApp e-Bill sharing
  const handleWhatsApp = (sale) => {
    const target = sale || inspectSale;
    if (!target) return;

    let phone = target.customerPhone || '';
    if (!phone) {
      phone = prompt('Enter customer 10-digit mobile number for WhatsApp Bill:', '9820154321');
      if (!phone) return;
    }

    let msg = `*🧾 PATEL R MART - TAX INVOICE*\n`;
    msg += `Station Road, Titwala (E), Thane\n`;
    msg += `Invoice: *${target.invoiceNumber}*\n`;
    msg += `Date: ${new Date(target.createdAt).toLocaleDateString('en-GB')} ${new Date(target.createdAt).toLocaleTimeString()}\n\n`;
    msg += `*ITEMS:*\n`;
    (target.items || []).forEach((item, idx) => {
      const name = item.product?.name || item.name;
      const rate = item.unitPrice ?? item.price ?? 0;
      const lineTotal = item.total ?? (rate * item.quantity);
      msg += `${idx + 1}. ${name} x${item.quantity} = ₹${Number(lineTotal).toFixed(2)}\n`;
    });
    msg += `\n*Subtotal:* ₹${Number(target.subtotal || 0).toFixed(2)}\n`;
    if (target.discount > 0) msg += `*Discount:* -₹${Number(target.discount).toFixed(2)}\n`;
    msg += `*GST (5%):* ₹${(Number(target.cgst || 0) + Number(target.sgst || 0)).toFixed(2)}\n`;
    msg += `*NET TOTAL:* *₹${Number(target.totalAmount || 0).toFixed(2)}*\n`;
    msg += `*Paid via:* ${target.paymentMethod || 'CASH'}\n\n`;
    msg += `_Thank you for shopping at Patel R Mart!_`;

    const cleanPh = phone.replace(/\D/g, '');
    const fullPh = cleanPh.length === 10 ? '91' + cleanPh : cleanPh;
    window.open(`https://wa.me/${fullPh}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Export Complete Sales CSV Report
  const exportSalesCSV = () => {
    const headers = [
      'Invoice Number', 
      'Date', 
      'Time', 
      'Cashier', 
      'Customer Name', 
      'Customer Phone', 
      'Payment Mode', 
      'Subtotal (INR)', 
      'Discount (INR)',
      'CGST (INR)', 
      'SGST (INR)', 
      'Grand Total (INR)'
    ];

    const rows = sales.map(s => [
      s.invoiceNumber,
      new Date(s.createdAt).toLocaleDateString('en-GB'),
      new Date(s.createdAt).toLocaleTimeString(),
      `"${s.user?.name || 'Counter 01'}"`,
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.customerPhone || 'N/A'}"`,
      s.paymentMethod,
      Number(s.subtotal || 0).toFixed(2),
      Number(s.discount || 0).toFixed(2),
      Number(s.cgst || 0).toFixed(2),
      Number(s.sgst || 0).toFixed(2),
      Number(s.totalAmount || 0).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patel_r_mart_sales_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-lowest">
      <Header 
        title="Sales Register & Tax Invoices" 
        subtitle="Patel R Mart, Titwala (E) • Transaction Audit Ledger & Digital Cash Memos" 
      />

      {/* Top Financial Telemetry Strip */}
      <div className="px-6 pt-4 pb-2 border-b border-border-subtle bg-surface-low/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Filtered Revenue</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-l border-border-subtle pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Invoices Count</span>
            <span className="text-xl font-bold font-mono text-white">
              {sales.length} Bills
            </span>
          </div>
          <div className="border-l border-border-subtle pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tax Collected (GST 5%)</span>
            <span className="text-xl font-bold font-mono text-sky-400">
              ₹{totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-l border-border-subtle pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tender Split</span>
            <span className="text-xs font-mono text-slate-300">
              <span className="text-emerald-400 font-bold">₹{cashSalesTotal.toFixed(0)}</span> Cash • <span className="text-sky-400 font-bold">₹{upiSalesTotal.toFixed(0)}</span> UPI
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchSales}
            disabled={loading}
            className="p-2 rounded-lg bg-surface-high hover:bg-surface-highest text-slate-400 hover:text-white border border-border-subtle transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={exportSalesCSV}
            className="px-3 py-2 rounded-lg bg-surface-high hover:bg-surface-highest text-xs font-mono text-slate-200 border border-border-subtle flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Column: Transactions Ledger Table (65%) */}
        <div className="w-[65%] flex flex-col bg-surface-low border border-border-subtle rounded-2xl overflow-hidden p-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Invoice No (INV-2026...), Mobile Phone, or Customer..."
                className="w-full bg-surface-high border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono focus:border-emerald-500 transition"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2 text-[10px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Date Range Tabs */}
            <div className="flex items-center space-x-1 bg-surface-high p-1 rounded-xl border border-border-subtle text-xs font-mono">
              {[
                { id: 'ALL', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: '7 Days' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setFilterDate(d.id)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterDate === d.id 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Payment Method Tabs */}
            <div className="flex items-center space-x-1 bg-surface-high p-1 rounded-xl border border-border-subtle text-xs font-mono">
              {['ALL', 'CASH', 'UPI'].map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMethod(m)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMethod === m 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-border-subtle/80">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-high z-10 border-b border-border-subtle font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-3.5">INVOICE NO</th>
                  <th className="py-3 px-3">DATE & TIME</th>
                  <th className="py-3 px-3">CUSTOMER</th>
                  <th className="py-3 px-3">ITEMS</th>
                  <th className="py-3 px-3">PAYMENT</th>
                  <th className="py-3 px-3 text-right">TOTAL</th>
                  <th className="py-3 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {sales.length > 0 ? (
                  sales.map((s) => {
                    const isSelected = inspectSale?.id === s.id;
                    const itemsCount = s.items?.reduce((cnt, it) => cnt + it.quantity, 0) || s.items?.length || 1;

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setInspectSale(s)}
                        className={`hover:bg-surface-high/50 transition cursor-pointer ${
                          isSelected ? 'bg-surface-high/80 border-l-4 border-emerald-400' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono font-bold text-white flex items-center space-x-1.5">
                          <span>{s.invoiceNumber}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(s.createdAt).toLocaleDateString('en-GB')}, {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-slate-200 font-medium">{s.customerName || 'Walk-in Customer'}</p>
                          {s.customerPhone && (
                            <p className="text-[10px] text-slate-400 font-mono">+91 {s.customerPhone}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {itemsCount} units
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            s.paymentMethod === 'UPI' 
                              ? 'bg-sky-950 text-sky-400 border border-sky-800/40' 
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          }`}>
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(s.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setModalSale(s); }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-highest transition"
                            title="Open Fullscreen Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      {loading ? 'Loading sales ledger...' : 'No invoices found matching your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-border-subtle mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Showing {sales.length} transactions</span>
            <span>Patel R Mart GST Ledger • Titwala (E)</span>
          </div>
        </div>

        {/* Right Column: Docked Thermal Cash Memo Inspector (35%) */}
        <div className="w-[35%] flex flex-col bg-surface-low border border-border-subtle rounded-2xl p-4 justify-between overflow-hidden">
          {inspectSale ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div>
                  <span className="font-bold text-white text-xs font-mono block">DIGITAL CASH MEMO</span>
                  <span className="text-[10px] font-mono text-emerald-400">{inspectSale.invoiceNumber}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setModalSale(inspectSale)}
                    className="p-1.5 rounded-lg bg-surface-high hover:bg-surface-highest text-slate-300 hover:text-white border border-border-subtle transition"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePrint(inspectSale)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 transition flex items-center gap-1 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill</span>
                  </button>
                </div>
              </div>

              {/* Thermal Invoice Paper Preview */}
              <div className="my-auto p-4 rounded-xl bg-white text-black font-mono text-xs shadow-xl overflow-y-auto max-h-[60vh]">
                <div id="inspect-thermal-receipt">
                  
                  {/* Store Header */}
                  <div className="text-center pb-2 dashed-bottom mb-2">
                    <h4 className="font-bold text-sm tracking-wider uppercase">PATEL R MART</h4>
                    <p className="text-[10px] text-gray-700">Station Road, Near Ganesh Temple, Titwala (E)</p>
                    <p className="text-[10px] text-gray-700">Thane, Maharashtra - 421605</p>
                    <p className="text-[9px] font-bold mt-0.5">GSTIN: 27AABCP9912Q1ZX</p>
                  </div>

                  {/* Metadata */}
                  <div className="text-[10px] space-y-0.5 mb-2">
                    <div className="flex justify-between">
                      <span>INVOICE:</span>
                      <span className="font-bold">{inspectSale.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span>{new Date(inspectSale.createdAt).toLocaleDateString('en-GB')} {new Date(inspectSale.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CASHIER:</span>
                      <span>{inspectSale.user?.name || 'Counter 01'}</span>
                    </div>
                    {inspectSale.customerPhone && (
                      <div className="flex justify-between">
                        <span>CUSTOMER:</span>
                        <span>+91 {inspectSale.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Table */}
                  <div className="dashed-border py-1.5 my-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between font-bold border-b border-dashed border-gray-400 pb-1">
                      <span className="w-32">ITEM</span>
                      <span className="text-center w-8">QTY</span>
                      <span className="text-right w-14">TOTAL</span>
                    </div>
                    {inspectSale.items?.map((it, idx) => {
                      const name = it.product?.name || it.name;
                      const rate = Number(it.unitPrice ?? it.price ?? 0);
                      const lineTotal = Number(it.total ?? (rate * it.quantity));

                      return (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate w-32">{idx + 1}. {name}</span>
                          <span className="text-center w-8">x{it.quantity}</span>
                          <span className="font-bold text-right w-14">₹{lineTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="text-[11px] pt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{Number(inspectSale.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {inspectSale.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount:</span>
                        <span>-₹{Number(inspectSale.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>CGST (2.5%):</span>
                      <span>₹{Number(inspectSale.cgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>SGST (2.5%):</span>
                      <span>₹{Number(inspectSale.sgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm solid-top pt-1 text-black">
                      <span>TOTAL PAYABLE:</span>
                      <span>₹{Number(inspectSale.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Settlement */}
                  <div className="dashed-top mt-2 pt-1 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>PAYMENT MODE:</span>
                      <span className="font-bold">{inspectSale.paymentMethod || 'CASH'}</span>
                    </div>
                    {inspectSale.paymentMethod === 'CASH' && (
                      <>
                        <div className="flex justify-between">
                          <span>Cash Received:</span>
                          <span>₹{Number(inspectSale.cashTendered || inspectSale.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-green-800">
                          <span>Change Returned:</span>
                          <span>₹{Number(inspectSale.changeReturned || 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="dashed-top text-center mt-3 pt-2 text-[9px] text-gray-600 space-y-0.5">
                    <p className="font-bold text-black">THANK YOU! VISIT AGAIN!</p>
                    <p>Patel R Mart • Titwala (E)</p>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action Footer */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                <button
                  onClick={() => handleWhatsApp(inspectSale)}
                  className="flex-1 py-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-xs font-semibold hover:bg-emerald-900/60 transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp e-Bill</span>
                </button>
                <button
                  onClick={() => setModalSale(inspectSale)}
                  className="px-3.5 py-2 rounded-xl bg-surface-high hover:bg-surface-highest text-white text-xs font-semibold border border-border-subtle transition"
                >
                  Full Invoice
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs font-mono my-auto">
              Select an invoice from the ledger to inspect and reprint receipt.
            </div>
          )}
        </div>

      </div>

      {/* Fullscreen Invoice Modal */}
      {modalSale && (
        <InvoiceModal sale={modalSale} onClose={() => setModalSale(null)} />
      )}
    </div>
  );
}
