const fs = require('fs');

const files = {
  'package.json': JSON.stringify({
    "name": "quickbill-server",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": { "start": "node server.js", "dev": "nodemon server.js" },
    "dependencies": {
      "express": "^4.18.2", "mongoose": "^8.0.0", "cors": "^2.8.5",
      "dotenv": "^16.3.0", "bcryptjs": "^2.4.3", "jsonwebtoken": "^9.0.0",
      "puppeteer": "^21.0.0", "nodemailer": "^6.9.0", "stripe": "^14.0.0"
    },
    "devDependencies": { "nodemon": "^3.0.0" }
  }, null, 2),

  '.env': `PORT=5000
MONGO_URI=mongodb://divyanshmeena5285:12345dm@ac-xideucb-shard-00-00.5pbblro.mongodb.net:27017,ac-xideucb-shard-00-01.5pbblro.mongodb.net:27017,ac-xideucb-shard-00-02.5pbblro.mongodb.net:27017/?ssl=true&replicaSet=atlas-htjwnh-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster3
JWT_SECRET=bec625ec3264618ea5662ac305645935cc9ed4342f036a94cb8c6162aa733310301533dfc2b01b7c3fb0ff2570eb1219432049845427195b115f1d82e6037f3d
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_WEBHOOK_SECRET=whsec_dummy
EMAIL_USER=test@test.com
EMAIL_PASS=testpass
CLIENT_URL=http://localhost:5173
`,

  '.gitignore': `node_modules
.env
`,

  'server.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'https://quickbill.vercel.app'], credentials: true }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/', (req, res) => res.json({ message: 'QuickBill API Running', status: 'OK' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
`,

  'models/User.js': `const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isPro: { type: Boolean, default: false },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  invoiceCountThisMonth: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
`,

  'models/Client.js': `const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Client', clientSchema);
`,

  'models/Invoice.js': `const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceNumber: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [{ description: { type: String, required: true }, quantity: { type: Number, required: true, default: 1 }, rate: { type: Number, required: true, default: 0 }, amount: { type: Number, required: true } }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid'], default: 'draft' },
  notes: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Invoice', invoiceSchema);
`,

  'middleware/authMiddleware.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
  }
  if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};
module.exports = { protect };
`,

  'middleware/proMiddleware.js': `const User = require('../models/User');
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
`,

  'controllers/authController.js': `const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all fields' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ _id: user.id, name: user.name, email: user.email, isPro: user.isPro, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ _id: user.id, name: user.name, email: user.email, isPro: user.isPro, token: generateToken(user._id) });
    } else res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
module.exports = { register, login, getMe };
`,

  'controllers/clientController.js': `const Client = require('../models/Client');
const getClients = async (req, res) => {
  try { const clients = await Client.find({ userId: req.user.id }).sort({ createdAt: -1 }); res.json(clients); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
const createClient = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
    const client = await Client.create({ userId: req.user.id, name, email, address, phone });
    res.status(201).json(client);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (client.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    const updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (client.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await client.deleteOne();
    res.json({ message: 'Client deleted', id: req.params.id });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
module.exports = { getClients, createClient, updateClient, deleteClient };
`,

  'controllers/invoiceController.js': `const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const generateInvoiceNumber = async (userId) => {
  const count = await Invoice.countDocuments({ userId });
  return 'INV-' + String(count + 1).padStart(4, '0');
};
const getInvoices = async (req, res) => {
  try { const invoices = await Invoice.find({ userId: req.user.id }).populate('clientId', 'name email').sort({ createdAt: -1 }); res.json(invoices); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('clientId', 'name email address phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    res.json(invoice);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const createInvoice = async (req, res) => {
  try {
    const { clientId, dueDate, items, taxRate, notes } = req.body;
    if (!clientId || !dueDate || !items || items.length === 0) return res.status(400).json({ message: 'Client, due date, and items required' });
    const client = await Client.findOne({ _id: clientId, userId: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = (subtotal * (taxRate || 0)) / 100;
    const total = subtotal + taxAmount;
    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    const invoice = await Invoice.create({
      userId: req.user.id, clientId, invoiceNumber, dueDate,
      items: items.map(item => ({ ...item, amount: item.quantity * item.rate })),
      subtotal, taxRate: taxRate || 0, taxAmount, total, notes
    });
    const user = await User.findById(req.user.id);
    if (!user.isPro) { user.invoiceCountThisMonth += 1; await user.save(); }
    await invoice.populate('clientId', 'name email');
    res.status(201).json(invoice);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const updateStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    invoice.status = req.body.status || invoice.status;
    await invoice.save();
    await invoice.populate('clientId', 'name email');
    res.json(invoice);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted', id: req.params.id });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
module.exports = { getInvoices, getInvoice, createInvoice, updateStatus, deleteInvoice };
`,

  'controllers/paymentController.js': `const User = require('../models/User');
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
`,

  'routes/authRoutes.js': `const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
module.exports = router;
`,

  'routes/clientRoutes.js': `const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
router.route('/').get(protect, getClients).post(protect, createClient);
router.route('/:id').put(protect, updateClient).delete(protect, deleteClient);
module.exports = router;
`,

  'routes/invoiceRoutes.js': `const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateStatus, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { checkProOrLimit } = require('../middleware/proMiddleware');
router.route('/').get(protect, getInvoices).post(protect, checkProOrLimit, createInvoice);
router.route('/:id').get(protect, getInvoice).delete(protect, deleteInvoice);
router.put('/:id/status', protect, updateStatus);
module.exports = router;
`,

  'routes/paymentRoutes.js': `const express = require('express');
const router = express.Router();
const { createCheckoutSession, webhook, testUpgrade } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/test-upgrade', protect, testUpgrade);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);
module.exports = router;
`,

  'templates/invoiceTemplate.js': `const invoiceTemplate = (invoice, client, user) => {
  const itemsHtml = invoice.items.map(item => '<tr><td style="padding:12px;border-bottom:1px solid #E5E7EB;">' + item.description + '</td><td style="padding:12px;border-bottom:1px solid #E5E7EB;text-align:center;">' + item.quantity + '</td><td style="padding:12px;border-bottom:1px solid #E5E7EB;text-align:right;">$' + item.rate.toFixed(2) + '</td><td style="padding:12px;border-bottom:1px solid #E5E7EB;text-align:right;">$' + item.amount.toFixed(2) + '</td></tr>').join('');
  const watermark = !user.isPro ? '<div style="position:fixed;bottom:30px;right:30px;opacity:0.4;font-size:14px;color:#999;">Created with QuickBill</div>' : '';
  return '<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;color:#333}.header{display:flex;justify-content:space-between;margin-bottom:50px}.invoice-title{font-size:36px;font-weight:bold;color:#4F46E5}.meta{text-align:right;color:#6b7280;font-size:14px;line-height:1.8}.from-to{display:flex;justify-content:space-between;margin-bottom:40px}.box{width:45%}.box h3{font-size:12px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px}.box p{margin:4px 0;font-size:14px}.box .name{font-size:18px;font-weight:600;color:#111;margin-bottom:6px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#F3F4F6;padding:14px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600}.totals{margin-top:30px;width:300px;margin-left:auto}.totals-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}.totals-row.total{font-size:20px;font-weight:bold;color:#4F46E5;border-top:2px solid #E5E7EB;padding-top:12px;margin-top:8px}.status{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase}.status-paid{background:#d1fae5;color:#065f46}.status-sent{background:#dbeafe;color:#1e40af}.status-draft{background:#f3f4f6;color:#4b5563}.notes{margin-top:40px;padding:20px;background:#f9fafb;border-radius:8px;font-size:14px;color:#4b5563}</style></head><body><div class="header"><div><div class="invoice-title">INVOICE</div><p style="color:#6b7280;margin-top:8px;">#' + invoice.invoiceNumber + '</p></div><div class="meta"><div><strong>Issue Date:</strong> ' + new Date(invoice.issueDate).toLocaleDateString() + '</div><div><strong>Due Date:</strong> ' + new Date(invoice.dueDate).toLocaleDateString() + '</div><div style="margin-top:10px;"><span class="status status-' + invoice.status + '">' + invoice.status + '</span></div></div></div><div class="from-to"><div class="box"><h3>From</h3><p class="name">' + user.name + '</p><p>' + user.email + '</p></div><div class="box"><h3>Bill To</h3><p class="name">' + client.name + '</p><p>' + client.email + '</p>' + (client.address ? '<p>' + client.address + '</p>' : '') + (client.phone ? '<p>' + client.phone + '</p>' : '') + '</div></div><table><thead><tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>' + itemsHtml + '</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal</span><span>$' + invoice.subtotal.toFixed(2) + '</span></div><div class="totals-row"><span>Tax (' + invoice.taxRate + '%)</span><span>$' + invoice.taxAmount.toFixed(2) + '</span></div><div class="totals-row total"><span>Total</span><span>$' + invoice.total.toFixed(2) + '</span></div></div>' + (invoice.notes ? '<div class="notes"><h3 style="margin-top:0;color:#6b7280;">Notes</h3><p>' + invoice.notes + '</p></div>' : '') + watermark + '</body></html>';
};
module.exports = invoiceTemplate;
`,

  'utils/generatePDF.js': `const puppeteer = require('puppeteer');
const invoiceTemplate = require('../templates/invoiceTemplate');
const generatePDF = async (invoice, client, user) => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const html = invoiceTemplate(invoice, client, user);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    await browser.close();
    return pdf;
  } catch (error) { console.error('PDF generation failed:', error.message); throw new Error('PDF generation failed'); }
};
module.exports = generatePDF;
`
};

// Create all files
Object.entries(files).forEach(([filePath, content]) => {
  const dir = require('path').dirname(filePath);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created:', filePath);
});

console.log('\\n✅ All files created!');
console.log('Run: npm install && npm run dev');