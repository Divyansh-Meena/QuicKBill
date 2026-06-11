const puppeteer = require('puppeteer');
const invoiceTemplate = require('../templates/invoiceTemplate');

const generatePDF = async (invoice, client, user) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    const html = invoiceTemplate(invoice, client, user);
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    return pdf;
  } catch (error) {
    console.error('PDF generation error:', error.message);
    // Fallback: return HTML as buffer if PDF fails
    const html = invoiceTemplate(invoice, client, user);
    return Buffer.from(html, 'utf-8');
  }
};

module.exports = generatePDF;