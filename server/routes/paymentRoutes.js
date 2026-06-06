const express = require('express');
const router = express.Router();
const { createCheckoutSession, webhook, testUpgrade } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/test-upgrade', protect, testUpgrade);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);
module.exports = router;
