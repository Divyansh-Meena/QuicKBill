const mongoose = require('mongoose');
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
