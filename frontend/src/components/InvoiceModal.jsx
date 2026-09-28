import React, { useRef } from 'react';
import { Printer, Share2, X, CheckCircle2, Download, ArrowRight } from 'lucide-react';

export default function InvoiceModal({ sale, onClose, onNewBill }) {
  if (!sale) return null;

  // Robust Thermal Print via isolated iframe (never clips, prints only receipt)
  const handlePrint = () => {
    const receiptEl = document.getElementById('printable-thermal-receipt');
    if (!receiptEl) {
      window.print();
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
            @page {
              size: 80mm auto;
              margin: 0;
            }
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
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .dashed-border { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin: 4px 0; }
            .dashed-top { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .dashed-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .solid-top { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
            .flex { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 11px; }
            th { text-align: left; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 10px; }
            td { padding: 2px 0; }
            .small { font-size: 9px; }
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

  // WhatsApp e-Bill Generator
  const handleWhatsApp = () => {
    const phone = sale.customerPhone || '';
    if (!phone) {
      const inputPhone = prompt('Enter customer 10-digit mobile number for WhatsApp Bill:', '9820154321');
      if (!inputPhone) return;
      sendWhatsApp(inputPhone);
    } else {
      sendWhatsApp(phone);
    }
  };

  const sendWhatsApp = (ph) => {
    let msg = `*🧾 PATEL R MART - TAX INVOICE*\n`;
    msg += `Station Road, Titwala (E), Thane\n`;
    msg += `Invoice: *${sale.invoiceNumber}*\n`;
    msg += `Date: ${new Date(sale.createdAt || Date.now()).toLocaleDateString('en-GB')}\n\n`;
    msg += `*ITEMS:*\n`;
    (sale.items || []).forEach((item, idx) => {
      const name = item.product?.name || item.name;
      const rate = item.unitPrice ?? item.price ?? 0;
      const lineTotal = item.total ?? (rate * item.quantity);
      msg += `${idx + 1}. ${name} x${item.quantity} = ₹${Number(lineTotal).toFixed(2)}\n`;
    });
    msg += `\n*Subtotal:* ₹${Number(sale.subtotal || 0).toFixed(2)}\n`;
    if (sale.discount > 0) msg += `*Discount:* -₹${Number(sale.discount).toFixed(2)}\n`;
    msg += `*GST (5%):* ₹${(Number(sale.cgst || 0) + Number(sale.sgst || 0)).toFixed(2)}\n`;
    msg += `*NET TOTAL:* *₹${Number(sale.totalAmount || 0).toFixed(2)}*\n`;
    msg += `*Paid via:* ${sale.paymentMethod || 'CASH'}\n\n`;
    msg += `_Thank you for shopping at Patel R Mart!_`;

    const cleanPh = ph.replace(/\D/g, '');
    const fullPh = cleanPh.length === 10 ? '91' + cleanPh : cleanPh;
    const url = `https://wa.me/${fullPh}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Download simple text memo
  const handleDownload = () => {
    let text = "========================================\n";
    text += "           PATEL R MART\n";
    text += "    Station Road, Titwala (E), Thane\n";
    text += "       GSTIN: 27AABCP9912Q1ZX\n";
    text += "========================================\n";
    text += `Invoice: ${sale.invoiceNumber}\n`;
    text += `Date:    ${new Date(sale.createdAt || Date.now()).toLocaleString()}\n`;
    text += `Cashier: ${sale.user?.name || 'Counter 01'}\n`;
    text += "----------------------------------------\n";
    text += "ITEM                    QTY  RATE  TOTAL\n";
    text += "----------------------------------------\n";
    (sale.items || []).forEach(it => {
      const name = (it.product?.name || it.name).slice(0, 20).padEnd(20, ' ');
      const qty = String(it.quantity).padStart(3, ' ');
      const rate = String(it.unitPrice ?? it.price ?? 0).padStart(5, ' ');
      const total = String(it.total ?? ((it.unitPrice ?? it.price ?? 0) * it.quantity)).padStart(6, ' ');
      text += `${name} ${qty} ${rate} ${total}\n`;
    });
    text += "----------------------------------------\n";
    text += `Subtotal:                    ₹${Number(sale.subtotal || 0).toFixed(2)}\n`;
    text += `GST (5%):                    ₹${(Number(sale.cgst || 0) + Number(sale.sgst || 0)).toFixed(2)}\n`;
    text += `GRAND TOTAL:                 ₹${Number(sale.totalAmount || 0).toFixed(2)}\n`;
    text += `Mode: ${sale.paymentMethod || 'CASH'}\n`;
    text += "========================================\n";
    text += "         THANK YOU! VISIT AGAIN\n";

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sale.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNextBill = () => {
    onClose();
    if (onNewBill) onNewBill();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111927] border border-slate-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Bill Generated Successfully</span>
              <span className="text-[11px] font-mono text-emerald-400">{sale.invoiceNumber}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-high transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="overflow-y-auto p-6 bg-[#0a0f1d] flex justify-center">
          
          {/* Printable 80mm Thermal Receipt */}
          <div 
            id="printable-thermal-receipt" 
            className="w-[340px] bg-white text-black p-5 rounded font-mono text-xs shadow-xl select-all"
          >
            {/* Mart Title & Address */}
            <div className="text-center dashed-bottom pb-2 mb-2">
              <h3 className="font-bold text-base tracking-wider uppercase">PATEL R MART</h3>
              <p className="text-[10px] text-gray-700">Station Road, Near Ganesh Temple, Titwala (E)</p>
              <p className="text-[10px] text-gray-700">Thane, Maharashtra - 421605</p>
              <p className="text-[10px] text-gray-700">Tel: +91 98201 98765</p>
              <p className="text-[10px] font-bold mt-1">GSTIN: 27AABCP9912Q1ZX</p>
              <p className="text-[9px] text-gray-600">FSSAI Lic: 11521018000452</p>
            </div>

            {/* Invoice Metadata */}
            <div className="text-[11px] mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(sale.createdAt || Date.now()).toLocaleDateString('en-GB')} {new Date(sale.createdAt || Date.now()).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.user?.name || 'Rahul (Counter 01)'}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>+91 {sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="dashed-border py-1.5 my-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold">
                    <th className="w-40">ITEM</th>
                    <th className="text-center w-8">QTY</th>
                    <th className="text-right w-12">RATE</th>
                    <th className="text-right w-14">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {(sale.items || []).map((item, idx) => {
                    const name = item.product?.name || item.name;
                    const rate = Number(item.unitPrice ?? item.price ?? 0);
                    const lineTotal = Number(item.total ?? (rate * item.quantity));

                    return (
                      <tr key={idx}>
                        <td className="py-0.5 truncate max-w-[140px]">{idx + 1}. {name}</td>
                        <td className="py-0.5 text-center font-bold">x{item.quantity}</td>
                        <td className="py-0.5 text-right">₹{rate.toFixed(2)}</td>
                        <td className="py-0.5 text-right font-bold">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between">
                <span>Subtotal ({sale.items?.length || 0} items):</span>
                <span>₹{Number(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Special Discount:</span>
                  <span>-₹{Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>CGST (2.5%):</span>
                <span>₹{Number(sale.cgst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>SGST (2.5%):</span>
                <span>₹{Number(sale.sgst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm solid-top pt-1 text-black">
                <span>NET PAYABLE:</span>
                <span>₹{Number(sale.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Tender Settlement */}
            <div className="dashed-top mt-2 pt-1 text-[11px] space-y-0.5">
              <div className="flex justify-between font-semibold">
                <span>PAYMENT MODE:</span>
                <span>{sale.paymentMethod || 'CASH'}</span>
              </div>
              {sale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>₹{Number(sale.cashTendered || sale.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-800">
                    <span>Change Returned:</span>
                    <span>₹{Number(sale.changeReturned || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Store Barcode & Footer Note */}
            <div className="dashed-top mt-3 pt-2 text-center text-[10px] space-y-1">
              <p className="font-bold text-xs tracking-wider">THANK YOU! VISIT AGAIN!</p>
              <p className="text-gray-600">Exchange within 24 hours with original bill.</p>
              <p className="text-green-700 font-semibold">🌱 Save Paper • Digital WhatsApp Bill Synced</p>
              <p className="text-gray-400 text-[9px] font-mono mt-1">*** END OF BILL ***</p>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1326] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-xs font-semibold hover:bg-emerald-900/60 transition"
              title="Send itemized receipt via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp e-Bill</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-surface-high hover:bg-surface-highest text-slate-300 hover:text-white border border-border-subtle transition"
              title="Download text receipt"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/25"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Invoice</span>
            </button>
            <button
              onClick={handleNextBill}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-surface-high hover:bg-surface-highest text-white text-xs font-semibold border border-border-subtle transition"
            >
              <span>Next Customer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
