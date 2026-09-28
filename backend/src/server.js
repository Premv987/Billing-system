require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const salesRoutes = require('./routes/sales.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const categoryRoutes = require('./routes/categories.routes');
const supplierRoutes = require('./routes/suppliers.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    store: 'Patel R Mart, Titwala (E)',
    system: 'Inventory & Billing Management System',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log(`  Patel R Mart API Server running on port ${PORT}`);
    console.log('  Store: Titwala (E) • Terminal Backend');
    console.log(`  API Docs: http://localhost:${PORT}/api/health`);
    console.log('==================================================');
  });
}

module.exports = app;
