export function printInvoiceHtml(invoice: any, customer: any) {
  const PRIMARY_COLOR = '#01358c';
  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '₹';
    }
  };
  const formatAmount = (amount: any) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatDate = (date: any) => {
    try {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toLocaleDateString('en-GB');
      if (date.toDate) return date.toDate().toLocaleDateString('en-GB');
      return String(date);
    } catch {
      return '';
    }
  };
  const html = `
    <html>
    <head>
      <title>Invoice - ${invoice.invoice_id || invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #fff; color: #222; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; color: #222; padding: 40px 48px; border-radius: 12px; border: 1px solid #eee; }
        .header-block { display: flex; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 24px; margin-bottom: 64px; }
        .header-block img { height: 56px; margin-right: 32px; }
        .company-details { text-align: left; }
        .company-name { font-size: 2rem; font-weight: 700; color: #222; margin-bottom: 2px; }
        .company-address { color: #888; font-size: 15px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .billto { }
        .billto-label { font-weight: 700; color: ${PRIMARY_COLOR}; margin-bottom: 4px; }
        .billto-value { font-weight: 500; margin-bottom: 2px; }
        .details { text-align: right; }
        .details-label { font-weight: 700; color: ${PRIMARY_COLOR}; margin-bottom: 4px; }
        .details-row { font-size: 13px; color: #444; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .summary-table th, .summary-table td { padding: 10px; font-size: 1rem; }
        .summary-table th { background: #f5f5f5; color: #222; font-weight: 700; border-bottom: 1px solid #eee; }
        .summary-table td { border-bottom: 1px solid #eee; }
        .summary-table tfoot td { font-weight: 700; color: ${PRIMARY_COLOR}; font-size: 16px; border-top: 2px solid #eee; }
        .notes { margin-bottom: 16px; color: #888; font-size: 13px; }
        .legal-note { color: #888; font-size: 0.95rem; margin-top: 32px; }
        .footer { color: #888; font-size: 1rem; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-block">
          <img src="/assets/vetqure.png" alt="Vetqure Logo" />
          <div class="company-details">
            <div class="company-name">VAMS Veterinary Consultancy Private Limited</div>
            <div class="company-address">KRA-113, Kedaram Nagar, Pattom, Trivandrum</div>
          </div>
        </div>
        <div class="row">
          <div class="billto">
            <div class="billto-label">Bill to</div>
            <div class="billto-value">${customer.entity_name}</div>
            <div class="billto-value">${customer.address || ''}</div>
            <div class="billto-value">${customer.email || ''}</div>
            <div class="billto-value">${customer.phone || ''}</div>
          </div>
          <div class="details">
            <div class="details-label">Details</div>
            <div class="details-row">Invoice number: <b>${invoice.invoice_id || invoice.id}</b></div>
            <div class="details-row">Invoice date: <b>${formatDate(invoice.date_created)}</b></div>
            <div class="details-row">Due date: <b>${formatDate(invoice.due_date)}</b></div>
            <div class="details-row">Status: <b>${invoice.status}</b></div>
          </div>
        </div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;">QTY</th>
              <th style="text-align:right;">Rate (${getCurrencySymbol(invoice.currency)})</th>
              <th style="text-align:right;">Amount (${getCurrencySymbol(invoice.currency)})</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align:right;">${item.quantity}</td>
                <td style="text-align:right;">${formatAmount(item.unit_price)}</td>
                <td style="text-align:right;">${formatAmount(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;">Total</td>
              <td style="text-align:right;">${getCurrencySymbol(invoice.currency)} ${formatAmount(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="notes"><b>Notes:</b> ${invoice.notes || '-'}</div>
        <div class="legal-note">
          This is an electronically generated invoice and does not require a signature.
        </div>
        <div class="footer">
          Thank you for your business!<br />VAMS Veterinary Consultancy Private Limited
        </div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
} 