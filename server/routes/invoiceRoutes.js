const express = require('express');
const router = express.Router();
const { 
  getInvoices, 
  getInvoice, 
  createInvoice, 
  updateStatus, 
  deleteInvoice,
  downloadPDF,
  sendInvoiceEmail
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

const { checkProOrLimit } = require('../middleware/proMiddleware'); // ADD THIS
router.route('/')
  .get(protect, getInvoices)
  .post(protect, checkProOrLimit, createInvoice);

router.route('/:id')
  .get(protect, getInvoice)
  .delete(protect, deleteInvoice);

router.put('/:id/status', protect, updateStatus);
router.get('/:id/pdf', protect, downloadPDF);
router.post('/:id/send', protect, sendInvoiceEmail);

module.exports = router;