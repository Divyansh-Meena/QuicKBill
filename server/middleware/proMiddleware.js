const User = require('../models/User');
const checkProOrLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isPro) return next();
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.invoiceCountThisMonth = 0;
      user.lastReset = now;
      await user.save();
    }
    if (user.invoiceCountThisMonth >= 5) return res.status(403).json({ message: 'Free limit reached. Upgrade to Pro.' });
    req.userData = user;
    next();
  } catch (error) { res.status(500).json({ message: error.message }); }
};
module.exports = { checkProOrLimit };
