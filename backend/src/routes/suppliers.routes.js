const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json({ success: true, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
});

module.exports = router;
