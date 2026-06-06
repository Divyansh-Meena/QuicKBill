const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Create Stripe checkout session
const createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Create Stripe customer if not exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'QuickBill Pro',
              description: 'Unlimited invoices, no watermark, premium features',
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/settings?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stripe webhook - handles successful payment
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription success
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Find user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (user) {
      user.isPro = true;
      user.stripeSubscriptionId = session.subscription;
      await user.save();
      console.log(`User ${user.email} upgraded to Pro!`);
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (user) {
      user.isPro = false;
      user.stripeSubscriptionId = null;
      await user.save();
      console.log(`User ${user.email} downgraded to Free`);
    }
  }

  res.json({ received: true });
};
// Test endpoint — instantly upgrade to Pro (for demo/interviews)
const testUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isPro = true;
    await user.save();
    res.json({ message: 'Upgraded to Pro (test mode)', isPro: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { createCheckoutSession, webhook, testUpgrade };