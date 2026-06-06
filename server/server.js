const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Stripe webhook needs RAW body before express.json()
// So we mount payment routes BEFORE express.json() for the webhook path
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Now apply express.json to all other routes
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Health check
app.get('/', (req, res) => res.send('QuickBill API Running'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));