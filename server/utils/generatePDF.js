const puppeteer = require('puppeteer');
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
