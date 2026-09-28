const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Patel R Mart database...');

  // 1. Clean existing records
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.stockTransaction.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Users (Admin + Cashier)
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashStaff = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Mr. Patel (Owner / Admin)',
      email: 'admin@patelrmart.com',
      passwordHash: passwordHashAdmin,
      role: 'ADMIN'
    }
  });

  const cashier = await prisma.user.create({
    data: {
      name: 'Rahul Sharma (Cashier)',
      email: 'rahul@patelrmart.com',
      passwordHash: passwordHashStaff,
      role: 'STAFF'
    }
  });

  console.log('Users created: Admin (admin@patelrmart.com / admin123), Staff (rahul@patelrmart.com / staff123)');

  // 3. Categories
  const categoriesData = [
    { name: 'Groceries & Staples', description: 'Flour, Rice, Pulses, Sugar, Salt' },
    { name: 'Dairy & Bakery', description: 'Fresh Milk, Butter, Bread, Paneer' },
    { name: 'Snacks & Confectionery', description: 'Biscuits, Namkeen, Chocolates' },
    { name: 'Beverages', description: 'Tea, Coffee, Cold drinks, Juices' },
    { name: 'Edible Oils & Ghee', description: 'Cooking oils, Mustard oil, Desi ghee' },
    { name: 'Household & Cleaning', description: 'Detergents, Soaps, Surface cleaners' },
    { name: 'Personal Care', description: 'Soaps, Shampoos, Toothpaste, Deodorants' }
  ];

  const catMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    catMap[cat.name] = created.id;
  }

  // 4. Suppliers
  const suppliersData = [
    { name: 'Mahalaxmi Wholesalers', phone: '9821033442', gstin: '27AABCM8821Q1Z', address: 'Bhiwandi APMC, Thane' },
    { name: 'Amul Direct Distributor', phone: '9820155667', gstin: '27AABCA1234F1Z', address: 'Kalyan (W), Maharashtra' },
    { name: 'Parle Agro Agency', phone: '9819077889', gstin: '27AABCP5678K1Z', address: 'Thane MIDC' },
    { name: 'Tata Consumer Distributors', phone: '9822011223', gstin: '27AABCT9988L1Z', address: 'Bhiwandi Logistics Hub' },
    { name: 'Adani Wilmar Depot', phone: '9833044556', gstin: '27AABCA5544J1Z', address: 'Panvel, Navi Mumbai' }
  ];

  const supMap = {};
  for (const sup of suppliersData) {
    const created = await prisma.supplier.create({ data: sup });
    supMap[sup.name] = created.id;
  }

  // 5. Products (Realistic Indian FMCG with EAN-13 barcodes)
  const products = [
    {
      barcode: '8901030383821',
      sku: 'SKU-GR-0024',
      name: 'Daawat Rozana Basmati Rice 5kg',
      brand: 'Daawat',
      categoryId: catMap['Groceries & Staples'],
      supplierId: supMap['Mahalaxmi Wholesalers'],
      purchasePrice: 410.0,
      sellingPrice: 500.0,
      quantity: 45,
      minimumStock: 20
    },
    {
      barcode: '8901262010052',
      sku: 'SKU-DY-0012',
      name: 'Amul Taaza Toned Milk 1L Pouch',
      brand: 'Amul',
      categoryId: catMap['Dairy & Bakery'],
      supplierId: supMap['Amul Direct Distributor'],
      purchasePrice: 52.0,
      sellingPrice: 60.0,
      quantity: 6, // Low stock on purpose
      minimumStock: 25
    },
    {
      barcode: '8901719102008',
      sku: 'SKU-SN-0088',
      name: 'Parle-G Gold Biscuits 1kg Pack',
      brand: 'Parle',
      categoryId: catMap['Snacks & Confectionery'],
      supplierId: supMap['Parle Agro Agency'],
      purchasePrice: 24.5,
      sellingPrice: 30.0,
      quantity: 112,
      minimumStock: 30
    },
    {
      barcode: '8906007281014',
      sku: 'SKU-EO-0045',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      brand: 'Fortune',
      categoryId: catMap['Edible Oils & Ghee'],
      supplierId: supMap['Adani Wilmar Depot'],
      purchasePrice: 122.0,
      sellingPrice: 145.0,
      quantity: 34,
      minimumStock: 15
    },
    {
      barcode: '8904004403011',
      sku: 'SKU-GR-0015',
      name: 'Tata Salt Vacuum Evaporated 1kg',
      brand: 'Tata',
      categoryId: catMap['Groceries & Staples'],
      supplierId: supMap['Tata Consumer Distributors'],
      purchasePrice: 23.0,
      sellingPrice: 28.0,
      quantity: 80,
      minimumStock: 25
    },
    {
      barcode: '8901058852210',
      sku: 'SKU-ND-0003',
      name: 'Maggi 2-Minute Masala Noodles 12-Pack',
      brand: 'Nestle',
      categoryId: catMap['Groceries & Staples'],
      supplierId: supMap['Mahalaxmi Wholesalers'],
      purchasePrice: 140.0,
      sellingPrice: 168.0,
      quantity: 54,
      minimumStock: 20
    },
    {
      barcode: '8901030012110',
      sku: 'SKU-PC-0102',
      name: 'Dettol Original Bathing Soap 4x125g Combo',
      brand: 'Dettol',
      categoryId: catMap['Personal Care'],
      supplierId: supMap['Mahalaxmi Wholesalers'],
      purchasePrice: 155.0,
      sellingPrice: 195.0,
      quantity: 15, // Low stock
      minimumStock: 20
    },
    {
      barcode: '8901491101835',
      sku: 'SKU-GR-0008',
      name: 'Aashirvaad Shudh Chakki Atta 10kg',
      brand: 'Aashirvaad',
      categoryId: catMap['Groceries & Staples'],
      supplierId: supMap['Mahalaxmi Wholesalers'],
      purchasePrice: 345.0,
      sellingPrice: 410.0,
      quantity: 19, // Low stock
      minimumStock: 25
    },
    {
      barcode: '8901030825314',
      sku: 'SKU-BV-0042',
      name: 'Brooke Bond Red Label Tea 500g',
      brand: 'Red Label',
      categoryId: catMap['Beverages'],
      supplierId: supMap['Tata Consumer Distributors'],
      purchasePrice: 215.0,
      sellingPrice: 260.0,
      quantity: 22,
      minimumStock: 15
    },
    {
      barcode: '8906010500119',
      sku: 'SKU-GR-0099',
      name: 'Madhur Pure & Hygienic Sugar 1kg',
      brand: 'Madhur',
      categoryId: catMap['Groceries & Staples'],
      supplierId: supMap['Mahalaxmi Wholesalers'],
      purchasePrice: 42.0,
      sellingPrice: 48.0,
      quantity: 4, // Critical stock
      minimumStock: 30
    }
  ];

  for (const prod of products) {
    const createdProd = await prisma.product.create({ data: prod });
    // Log initial stock in transaction
    await prisma.stockTransaction.create({
      data: {
        productId: createdProd.id,
        type: 'STOCK_IN',
        quantity: prod.quantity,
        reference: 'INITIAL_STORE_OPENING',
        userId: admin.id
      }
    });
  }

  // 6. Sample Initial Sale
  const sampleSale = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-2026-000123',
      userId: cashier.id,
      customerPhone: '9820154321',
      customerName: 'Suresh M.',
      subtotal: 1240.0,
      discount: 0.0,
      cgst: 31.0,
      sgst: 31.0,
      totalAmount: 1302.0,
      paymentMethod: 'CASH',
      cashTendered: 1500.0,
      changeReturned: 198.0,
      paymentStatus: 'COMPLETED'
    }
  });

  console.log('Sample sale INV-2026-000123 seeded successfully.');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
