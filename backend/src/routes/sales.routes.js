const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to generate invoice number
async function generateInvoiceNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const count = await prisma.sale.count();
  const seq = String(count + 1).padStart(6, '0');
  return `INV-${year}-${seq}`;
}

// POST /api/sales (Atomic billing checkout)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, customerPhone, customerName, discount = 0, paymentMethod = 'CASH', cashTendered } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    // Atomic transaction for ACID compliance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability (PRD Rule 1)
      let subtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        let product = null;
        if (item.productId) {
          try {
            product = await tx.product.findUnique({ where: { id: item.productId } });
          } catch (e) {}
        }
        if (!product && item.barcode) {
          product = await tx.product.findUnique({ where: { barcode: item.barcode } });
        }
        if (!product && item.name) {
          product = await tx.product.findFirst({ where: { name: item.name } });
        }
        if (!product) {
          throw new Error(`Product "${item.name || item.productId}" not found`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${product.quantity} units available.`);
        }

        const lineTotal = product.sellingPrice * item.quantity;
        subtotal += lineTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          total: lineTotal
        });
      }

      // 2. Tax calculations (GST: 2.5% CGST + 2.5% SGST = 5%)
      const discountAmount = parseFloat(discount) || 0;
      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      const cgst = +(discountedSubtotal * 0.025).toFixed(2);
      const sgst = +(discountedSubtotal * 0.025).toFixed(2);
      const totalAmount = +(discountedSubtotal + cgst + sgst).toFixed(2);

      const tendered = cashTendered ? parseFloat(cashTendered) : totalAmount;
      const change = Math.max(0, +(tendered - totalAmount).toFixed(2));

      // 3. Create Sale record
      const invoiceNumber = await generateInvoiceNumber();
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: req.user.id,
          customerPhone,
          customerName,
          subtotal,
          discount: discountAmount,
          cgst,
          sgst,
          totalAmount,
          paymentMethod,
          cashTendered: tendered,
          changeReturned: change,
          paymentStatus: 'COMPLETED'
        }
      });

      // 4. Create Sale Items and Decrement Inventory (PRD Rule 2)
      for (const vi of verifiedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: vi.productId,
            quantity: vi.quantity,
            unitPrice: vi.unitPrice,
            total: vi.total
          }
        });

        // Decrement product stock
        await tx.product.update({
          where: { id: vi.productId },
          data: { quantity: { decrement: vi.quantity } }
        });

        // Log StockTransaction
        await tx.stockTransaction.create({
          data: {
            productId: vi.productId,
            type: 'SALE',
            quantity: -vi.quantity,
            reference: invoiceNumber,
            userId: req.user.id
          }
        });
      }

      return {
        ...sale,
        items: verifiedItems
      };
    });

    res.status(201).json({ success: true, message: 'Bill generated successfully', sale: result });
  } catch (err) {
    console.error('Sale creation error:', err);
    res.status(400).json({ success: false, message: err.message || 'Billing transaction failed' });
  }
});

// GET /api/sales (List transactions with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, paymentMethod, date } = req.query;
    const where = {};

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (date === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    } else if (date === 'yesterday') {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date();
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfYesterday, lte: endOfYesterday };
    } else if (date === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (date === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerPhone: { contains: search } },
        { customerName: { contains: search } }
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: sales.length, sales });
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sales history' });
  }
});

// GET /api/sales/:id (Single invoice details)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true, category: true } }
          }
        }
      }
    });

    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving invoice' });
  }
});

module.exports = router;
