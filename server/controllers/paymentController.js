const User = require('../models/User');
let stripe = null;
try {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key && key.startsWith('sk_') && !key.includes('dummy') && !key.includes('your')) {
    stripe = require('stripe')(key);
  }
} catch (e) { console.log('Stripe not available'); }

const createCheckoutSession = async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });
  try {
    const user = await User.findById(req.user.id);
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'QuickBill Pro', description: 'Unlimited invoices, no watermark' },
          unit_amount: 999,
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: (process.env.CLIENT_URL || 'http://localhost:5173') + '/settings?success=true',
      cancel_url: (process.env.CLIENT_URL || 'http://localhost:5173') + '/pricing?canceled=true'
    });
    res.json({ url: session.url });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const webhook = async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send('Webhook Error: ' + err.message); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (user) { user.isPro = true; user.stripeSubscriptionId = session.subscription; await user.save(); }
  }
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (user) { user.isPro = false; user.stripeSubscriptionId = null; await user.save(); }
  }
  res.json({ received: true });
};

const testUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isPro = true;
    await user.save();
    res.json({ message: 'Upgraded to Pro (test mode)', isPro: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createCheckoutSession, webhook, testUpgrade };
