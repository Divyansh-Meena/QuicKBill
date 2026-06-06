const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateStatus, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { checkProOrLimit } = require('../middleware/proMiddleware');
router.route('/').get(protect, getInvoices).post(protect, checkProOrLimit, createInvoice);
router.route('/:id').get(protect, getInvoice).delete(protect, deleteInvoice);
router.put('/:id/status', protect, updateStatus);
module.exports = router;
