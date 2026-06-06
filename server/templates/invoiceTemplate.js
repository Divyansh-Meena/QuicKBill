const invoiceTemplate = (invoice, client, user) => {
  const itemsHtml = invoice.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">$${item.rate.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">$${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const watermark = !user.isPro ? `
    <div style="position: fixed; bottom: 30px; right: 30px; opacity: 0.4; font-size: 14px; color: #999;">
      Created with QuickBill
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; }
        .header { display: flex; justify-content: space-between; margin-bottom: 50px; }
        .invoice-title { font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: -1px; }
        .meta { text-align: right; color: #6b7280; font-size: 14px; line-height: 1.8; }
        .from-to { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .box { width: 45%; }
        .box h3 { font-size: 12px; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; letter-spacing: 1px; }
        .box p { margin: 4px 0; font-size: 14px; }
        .box .name { font-size: 18px; font-weight: 600; color: #111; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #F3F4F6; padding: 14px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
        .totals { margin-top: 30px; width: 300px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals-row.total { font-size: 20px; font-weight: bold; color: #4F46E5; border-top: 2px solid #E5E7EB; padding-top: 12px; margin-top: 8px; }
        .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-draft { background: #f3f4f6; color: #4b5563; }
        .notes { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #4b5563; }
        ${!user.isPro ? '.watermark { position: fixed; bottom: 30px; right: 30px; opacity: 0.3; font-size: 13px; color: #9ca3af; }' : ''}
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="invoice-title">INVOICE</div>
          <p style="color: #6b7280; margin-top: 8px;">#${invoice.invoiceNumber}</p>
        </div>
        <div class="meta">
          <div><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</div>
          <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
          <div style="margin-top: 10px;">
            <span class="status status-${invoice.status}">${invoice.status}</span>
          </div>
        </div>
      </div>

      <div class="from-to">
        <div class="box">
          <h3>From</h3>
          <p class="name">${user.name}</p>
          <p>${user.email}</p>
        </div>
        <div class="box">
          <h3>Bill To</h3>
          <p class="name">${client.name}</p>
          <p>${client.email}</p>
          ${client.address ? `<p>${client.address}</p>` : ''}
          ${client.phone ? `<p>${client.phone}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>$${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Tax (${invoice.taxRate}%)</span>
          <span>$${invoice.taxAmount.toFixed(2)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>$${invoice.total.toFixed(2)}</span>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <h3 style="margin-top: 0; color: #6b7280;">Notes</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      ${!user.isPro ? '<div class="watermark">Created with QuickBill</div>' : ''}
    </body>
    </html>
  `;
};

module.exports = invoiceTemplate;