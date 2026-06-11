const downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user.id);
    const pdf = await generatePDF(invoice, invoice.clientId, user);
    
    // Check if it's actually a PDF or HTML fallback
    const isPDF = pdf[0] === 0x25; // PDF starts with '%'
    
    if (isPDF) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.html`);
    }
    
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};