const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/products (List, search, filter)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, categoryId, status, supplierId } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } }
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/barcode/:barcode (Fast lookup for billing barcode scanner)
router.get('/barcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    if (!product || product.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to search barcode' });
  }
});

// POST /api/products (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let { barcode, sku, name, brand, categoryId, supplierId, purchasePrice, sellingPrice, quantity, minimumStock, expiryDate } = req.body;

    if (!barcode) {
      barcode = '890' + Math.floor(1000000000 + Math.random() * 9000000000);
    }
    if (!sku) {
      sku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    }

    // Resolve or fallback category
    if (!categoryId) {
      const defaultCat = await prisma.category.findFirst();
      categoryId = defaultCat ? defaultCat.id : (await prisma.category.create({ data: { name: 'Groceries & Staples' } })).id;
    } else {
      const catExists = await prisma.category.findUnique({ where: { id: categoryId } }).catch(() => null);
      if (!catExists) {
        const defaultCat = await prisma.category.findFirst();
        categoryId = defaultCat ? defaultCat.id : (await prisma.category.create({ data: { name: 'Groceries & Staples' } })).id;
      }
    }

    // Resolve or fallback supplier
    if (!supplierId) {
      const defaultSup = await prisma.supplier.findFirst();
      supplierId = defaultSup ? defaultSup.id : (await prisma.supplier.create({ data: { name: 'Mahalaxmi Wholesalers, Kalyan' } })).id;
    } else {
      const supExists = await prisma.supplier.findUnique({ where: { id: supplierId } }).catch(() => null);
      if (!supExists) {
        const defaultSup = await prisma.supplier.findFirst();
        supplierId = defaultSup ? defaultSup.id : (await prisma.supplier.create({ data: { name: 'Mahalaxmi Wholesalers, Kalyan' } })).id;
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        barcode,
        sku,
        name,
        brand: brand || 'Patel R Mart',
        categoryId,
        supplierId,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        quantity: parseInt(quantity) || 0,
        minimumStock: parseInt(minimumStock) || 10,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        category: true,
        supplier: true
      }
    });

    // Record initial stock transaction
    if (quantity > 0) {
      try {
        await prisma.stockTransaction.create({
          data: {
            productId: newProduct.id,
            type: 'STOCK_IN',
            quantity: parseInt(quantity),
            reference: 'INITIAL_ENTRY',
            userId: req.user.id
          }
        });
      } catch (e) {}
    }

    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, categoryId, supplierId, purchasePrice, sellingPrice, minimumStock, expiryDate, status } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        categoryId,
        supplierId,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: status || undefined
      }
    });

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id (Soft-deactivate product to preserve history - Rule 4)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deactivated = await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
    res.json({ success: true, message: 'Product marked as inactive', product: deactivated });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to deactivate product' });
  }
});

module.exports = router;
