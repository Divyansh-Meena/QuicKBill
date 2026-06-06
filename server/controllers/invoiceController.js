const Invoice = require('../models/Invoice');
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
