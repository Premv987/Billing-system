const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { items: true }
    });

    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' }
    });

    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTransactions = sales.length;
    const itemsSoldCount = sales.reduce((sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);
    const avgBillValue = totalTransactions > 0 ? Math.round(totalSalesRevenue / totalTransactions) : 0;

    let cashTotal = 0;
    let upiTotal = 0;
    sales.forEach(s => {
      if (s.paymentMethod === 'CASH') cashTotal += s.totalAmount;
      else if (s.paymentMethod === 'UPI') upiTotal += s.totalAmount;
    });

    const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity <= p.minimumStock && p.quantity > 0).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;

    res.json({
      success: true,
      stats: {
        todaySales: totalSalesRevenue,
        transactionsCount: totalTransactions,
        avgBillValue,
        itemsSoldCount,
        totalProducts: products.length,
        totalUnits,
        lowStockCount,
        outOfStockCount,
        cashTotal,
        upiTotal
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats' });
  }
});

module.exports = router;
