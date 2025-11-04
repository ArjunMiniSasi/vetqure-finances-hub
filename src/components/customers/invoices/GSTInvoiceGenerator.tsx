import React from 'react';
import { Invoice, Customer } from '@/services/firestoreService';

interface GSTInvoiceGeneratorProps {
  invoice: Invoice;
  customer: Customer;
  businessProfile?: {
    displayName: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    gstin?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
}

const GSTInvoiceGenerator: React.FC<GSTInvoiceGeneratorProps> = ({ 
  invoice, 
  customer, 
  businessProfile 
}) => {
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

  const formatCurrency = (amount: any) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '\u20B9';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '\u20B9';
    }
  };

  const toWords = (num: number) => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n/10)] + (n%10? ' ' + a[n%10]: '');
      if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n%100? ' ' + inWords(n%100): '');
      if (n < 100000) return inWords(Math.floor(n/1000)) + ' Thousand' + (n%1000? ' ' + inWords(n%1000): '');
      if (n < 10000000) return inWords(Math.floor(n/100000)) + ' Lakh' + (n%100000? ' ' + inWords(n%100000): '');
      return inWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000? ' ' + inWords(n%10000000): '');
    };
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    return `${inWords(rupees)} Only` + (paise ? ` and ${inWords(paise)} Paise` : '');
  };

  // Calculate GST totals
  const calculateGSTTotals = () => {
    let totals = { cgst: 0, sgst: 0, igst: 0, taxable: 0 };
    
    // Calculate taxable amount from items
    const taxableAmount = (invoice.items || []).reduce((sum, item) => {
      return sum + (item.taxable_amount || item.amount || (item.unit_price * item.quantity));
    }, 0);

    if (invoice.cgst_amount !== undefined || invoice.sgst_amount !== undefined || invoice.igst_amount !== undefined) {
      // Use stored GST values
      totals = {
        cgst: invoice.cgst_amount || 0,
        sgst: invoice.sgst_amount || 0,
        igst: invoice.igst_amount || 0,
        taxable: taxableAmount
      };
    } else {
      // Calculate from taxable amount based on GST type
      totals.taxable = taxableAmount;
      
      if (invoice.gst_type === 'inter_state') {
        // Inter-state: 18% IGST
        totals.igst = (taxableAmount * 18) / 100;
      } else {
        // Intra-state: 9% CGST + 9% SGST
        totals.cgst = (taxableAmount * 9) / 100;
        totals.sgst = (taxableAmount * 9) / 100;
      }
    }
    
    return totals;
  };

  const gstTotals = calculateGSTTotals();
  const grandTotal = invoice.grand_total || invoice.total;

  // Create HSN/SAC summary
  const createHSNSummary = () => {
    const hsnMap: Record<string, { taxable: number; cgstRate: number; sgstRate: number; igstRate: number; cgstAmt: number; sgstAmt: number; igstAmt: number }> = {};
    
    // Calculate total taxable amount for proportional distribution
    const totalTaxableAmount = (invoice.items || []).reduce((sum, item) => {
      return sum + (item.taxable_amount || item.amount || (item.unit_price * item.quantity));
    }, 0);
    
    (invoice.items || []).forEach((item: any) => {
      const key = item.hsn_sac_code || '9987';
      const line = item.taxable_amount || item.amount || (item.unit_price * item.quantity);
      
      if (!hsnMap[key]) {
        hsnMap[key] = { 
          taxable: 0, 
          cgstRate: 0, 
          sgstRate: 0, 
          igstRate: 0, 
          cgstAmt: 0, 
          sgstAmt: 0, 
          igstAmt: 0 
        };
      }
      
      hsnMap[key].taxable += line;
      
      // Calculate GST amounts based on taxable amount
      if (invoice.gst_type === 'inter_state') {
        hsnMap[key].igstRate = 18;
        hsnMap[key].igstAmt += (line * 18) / 100;
      } else {
        hsnMap[key].cgstRate = 9;
        hsnMap[key].sgstRate = 9;
        hsnMap[key].cgstAmt += (line * 9) / 100;
        hsnMap[key].sgstAmt += (line * 9) / 100;
      }
    });

    return hsnMap;
  };

  const hsnSummary = createHSNSummary();

  const generateGSTInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${invoice.invoice_number || invoice.invoice_id || invoice.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #000; 
            background: #fff;
            font-size: 12px;
            line-height: 1.3;
          }
          .container { 
            width: 820px; 
            margin: 0 auto; 
            border: 2px solid #000; 
            padding: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .grid2 { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 6px; 
            margin-top: 6px; 
          }
          .box { 
            border: 1px solid #000; 
            padding: 8px; 
            font-size: 11px; 
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11px; 
            margin-top: 6px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left;
          }
          th { 
            background: #f3f3f3; 
            font-weight: bold;
            text-align: center;
          }
          .right { 
            text-align: right; 
          }
          .center { 
            text-align: center; 
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 11px; 
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .logo {
            max-height: 60px;
            margin-bottom: 10px;
          }
          .amount-words {
            font-weight: bold;
            margin-top: 5px;
          }
          .gst-breakdown {
            margin-top: 10px;
          }
          .total-section {
            border-top: 2px solid #000;
            margin-top: 10px;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header with Logo and Title -->
          <div class="header">
            <img src="/assets/vetqure.png" alt="VetQure Logo" class="logo" />
            <div class="title">TAX INVOICE</div>
          </div>

          <!-- Company and Invoice Details -->
          <div class="grid2">
            <div class="box">
              <div style="font-weight: bold; font-size: 13px; margin-bottom: 5px;">
                ${businessProfile?.displayName || 'VAMS Veterinary Consultancy Pvt Ltd'}
              </div>
              ${businessProfile?.address?.line1 ? `${businessProfile.address.line1}<br/>` : ''}
              ${businessProfile?.address?.line2 ? `${businessProfile.address.line2}<br/>` : ''}
              ${businessProfile?.address?.city ? `${businessProfile.address.city}, ${businessProfile.address.state} - ${businessProfile.address.pincode}<br/>` : 'KRA-113, Kedaram Nagar, Pattom, Trivandrum<br/>'}
              GSTIN/UIN: ${businessProfile?.gstin || invoice.company_gst_number || '32AAGCV9195E1Z2'}<br/>
              State Name: ${businessProfile?.address?.state || 'Kerala'}, Code: 32<br/>
              E-Mail: ${businessProfile?.contactEmail || 'info@vamsvetconsultancy.com'}<br/>
              Phone: ${businessProfile?.contactPhone || '+91 9562819995'}
            </div>
            <div class="box">
              <div class="row"><span>Invoice No.</span><span>${invoice.invoice_number || invoice.invoice_id || invoice.id}</span></div>
              <div class="row"><span>Dated</span><span>${formatDate(invoice.date_created)}</span></div>
              <div class="row"><span>Due Date</span><span>${formatDate(invoice.due_date)}</span></div>
              <div class="row"><span>Delivery Note</span><span>-</span></div>
              <div class="row"><span>Reference No. & Date</span><span>-</span></div>
              <div class="row"><span>Other References</span><span>-</span></div>
              <div class="row"><span>Buyer's Order No.</span><span>-</span></div>
              <div class="row"><span>Dated</span><span>-</span></div>
            </div>
          </div>

          <!-- Customer Details -->
          <div class="grid2" style="margin-top: 6px;">
            <div class="box">
              <div style="font-weight: bold; margin-bottom: 5px;">Consignee (Ship to)</div>
              <div style="font-weight: bold;">${customer.entity_name || customer.name}</div>
              ${customer.address}<br/>
              GSTIN/UIN: ${invoice.customer_gst_number || customer.gst_number || 'N/A'}<br/>
              State Name: ${customer.state || 'N/A'}, Code: ${customer.state ? (customer.state === 'Kerala' ? '32' : 'XX') : 'XX'}
            </div>
            <div class="box">
              <div style="font-weight: bold; margin-bottom: 5px;">Buyer (Bill to)</div>
              <div style="font-weight: bold;">${customer.entity_name || customer.name}</div>
              ${customer.address}<br/>
              GSTIN/UIN: ${invoice.customer_gst_number || customer.gst_number || 'N/A'}<br/>
              State Name: ${customer.state || 'N/A'}, Code: ${customer.state ? (customer.state === 'Kerala' ? '32' : 'XX') : 'XX'}<br/>
              Place of Supply: ${customer.state || 'Kerala'}
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">Sl</th>
                <th style="width: 35%;">Description of Goods</th>
                <th style="width: 10%;">HSN/SAC</th>
                <th style="width: 8%;">GST Rate</th>
                <th style="width: 8%;">Quantity</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 8%;">Disc. %</th>
                <th style="width: 16%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map((item: any, idx: number) => {
                const gstRate = item.tax_rate || 18;
                const taxableAmount = item.taxable_amount || item.amount || (item.unit_price * item.quantity);
                return `
                  <tr>
                    <td class="center">${idx + 1}</td>
                    <td>${item.description}</td>
                    <td class="center">${item.hsn_sac_code || '9987'}</td>
                    <td class="center">${gstRate}%</td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${formatCurrency(item.unit_price)}</td>
                    <td class="center">-</td>
                    <td class="right">${formatCurrency(taxableAmount)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>

          <!-- Amount and GST Details -->
          <div class="grid2" style="margin-top: 6px;">
            <div class="box">
              <div style="font-weight: bold; margin-bottom: 5px;">Amount Chargeable (in words)</div>
              <div class="amount-words">INR ${toWords(Math.round(grandTotal))}</div>
            </div>
            <div class="box">
              <div class="row"><span>Subtotal</span><span>${formatCurrency(gstTotals.taxable)}</span></div>
              ${invoice.gst_type === 'inter_state' ? `
                ${gstTotals.igst > 0 ? `<div class="row"><span>Output IGST (18%)</span><span>${formatCurrency(gstTotals.igst)}</span></div>` : ''}
              ` : `
                ${gstTotals.cgst > 0 ? `<div class="row"><span>Output CGST (9%)</span><span>${formatCurrency(gstTotals.cgst)}</span></div>` : ''}
                ${gstTotals.sgst > 0 ? `<div class="row"><span>Output SGST (9%)</span><span>${formatCurrency(gstTotals.sgst)}</span></div>` : ''}
              `}
              ${invoice.total_gst_amount && invoice.total_gst_amount > 0 ? `
                <div class="row"><span>Total GST</span><span>${formatCurrency(invoice.total_gst_amount)}</span></div>
              ` : ''}
              <div class="row total-section" style="font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
                <span>Total</span><span>${formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <!-- GST Breakdown Table -->
          <div class="box gst-breakdown" style="margin-top: 6px;">
            <table>
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Taxable Value</th>
                  ${invoice.gst_type === 'inter_state' ? `
                    <th>IGST Rate</th>
                    <th>IGST Amount</th>
                    <th>Total Tax Amount</th>
                  ` : `
                    <th>CGST Rate</th>
                    <th>CGST Amount</th>
                    <th>SGST/UTGST Rate</th>
                    <th>SGST/UTGST Amount</th>
                    <th>Total Tax Amount</th>
                  `}
                </tr>
              </thead>
              <tbody>
                ${Object.entries(hsnSummary).map(([code, v]) => `
                  <tr>
                    <td class="center">${code}</td>
                    <td class="right">${formatCurrency(v.taxable)}</td>
                    ${invoice.gst_type === 'inter_state' ? `
                      <td class="center">${v.igstRate || 0}%</td>
                      <td class="right">${formatCurrency(v.igstAmt)}</td>
                      <td class="right">${formatCurrency(v.igstAmt)}</td>
                    ` : `
                      <td class="center">${v.cgstRate || 0}%</td>
                      <td class="right">${formatCurrency(v.cgstAmt)}</td>
                      <td class="center">${v.sgstRate || 0}%</td>
                      <td class="right">${formatCurrency(v.sgstAmt)}</td>
                      <td class="right">${formatCurrency(v.cgstAmt + v.sgstAmt)}</td>
                    `}
                  </tr>
                `).join('')}
                <tr style="font-weight: bold; border-top: 2px solid #000;">
                  <td class="right">Total</td>
                  <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.taxable, 0))}</td>
                  ${invoice.gst_type === 'inter_state' ? `
                    <td></td>
                    <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.igstAmt, 0))}</td>
                    <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.igstAmt, 0))}</td>
                  ` : `
                    <td></td>
                    <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.cgstAmt, 0))}</td>
                    <td></td>
                    <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.sgstAmt, 0))}</td>
                    <td class="right">${formatCurrency(Object.values(hsnSummary).reduce((s, v: any) => s + v.cgstAmt + v.sgstAmt, 0))}</td>
                  `}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div style="margin-bottom: 10px;">
              <strong>Terms & Conditions:</strong><br/>
              • Payment due by: ${formatDate(invoice.due_date)}<br/>
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Bank Details:</strong><br/>
              Bank Name: HDFC BANK<br/>
              Account No: 50200042306880<br/>
              IFSC Code: HDFC0001258
            </div>
            <div>
              <strong>This is a Computer Generated Invoice</strong><br/>
              Thank you for your business!<br/>
              VAMS Veterinary Consultancy Private Limited
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: generateGSTInvoiceHTML() }}
      style={{ fontFamily: 'Arial, sans-serif' }}
    />
  );
};

export default GSTInvoiceGenerator;
