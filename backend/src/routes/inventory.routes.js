const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/inventory/low-stock (Low stock alerts)
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    // Return products where quantity <= minimumStock
    const allActive = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true, supplier: true }
    });

    const lowStock = allActive.filter(p => p.quantity <= p.minimumStock);
    res.json({ success: true, count: lowStock.length, products: lowStock });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock alerts' });
  }
});

// POST /api/inventory/stock-in (Receive goods from supplier)
router.post('/stock-in', authenticateToken, async (req, res) => {
  try {
    const { productId, quantityReceived, challanNumber, purchasePrice } = req.body;
    const qty = parseInt(quantityReceived);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity received' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id: productId } });
      if (!prod) throw new Error('Product not found');

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: { increment: qty },
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : prod.purchasePrice
        }
      });

      const txRecord = await tx.stockTransaction.create({
        data: {
          productId,
          type: 'STOCK_IN',
          quantity: qty,
          reference: challanNumber || 'PURCHASE_RECEIPT',
          userId: req.user.id
        }
      });

      return { product: updated, transaction: txRecord };
    });

    res.json({ success: true, message: 'Stock received and updated successfully', data: result });
  } catch (err) {
    console.error('Stock-in error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to process stock-in' });
  }
});

// POST /api/inventory/adjust (Manual inventory correction)
router.post('/adjust', authenticateToken, async (req, res) => {
  try {
    const { productId, newQuantity, reason } = req.body;
    const newQty = parseInt(newQuantity);

    if (!productId || isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id: productId } });
      if (!prod) throw new Error('Product not found');

      const diff = newQty - prod.quantity;

      const updated = await tx.product.update({
        where: { id: productId },
        data: { quantity: newQty }
      });

      await tx.stockTransaction.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          quantity: diff,
          reference: reason || 'STOCK_AUDIT',
          userId: req.user.id
        }
      });

      return updated;
    });

    res.json({ success: true, message: 'Inventory adjusted', product: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/transactions (Audit log)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const txs = await prisma.stockTransaction.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        user: { select: { id: true, name: true } }
      }
    });
    res.json({ success: true, transactions: txs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction log' });
  }
});

module.exports = router;
