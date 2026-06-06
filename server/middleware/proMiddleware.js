const User = require('../models/User');

const checkProOrLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Pro users have no limits
    if (user.isPro) return next();

    // Check if we need to reset monthly count
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.invoiceCountThisMonth = 0;
      user.lastReset = now;
      await user.save();
    }

    // Check free limit (5 invoices/month)
    if (user.invoiceCountThisMonth >= 5) {
      return res.status(403).json({
        message: 'Free limit reached: 5 invoices/month. Upgrade to Pro for unlimited invoices.',
        upgradeUrl: '/pricing'
      });
    }

    // Increment count (we'll do this after successful creation, but check here first)
    req.userData = user; // Pass user to controller
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkProOrLimit };