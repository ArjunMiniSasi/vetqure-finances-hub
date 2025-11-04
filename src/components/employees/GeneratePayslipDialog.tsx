import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';

interface GeneratePayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}

const defaultBreakdownPercents = {
  basic: 0.84,
  hra: 0.068,
  conveyance: 0.068,
  special: 0.022,
};

const modeOfPaymentOptions = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Other',
];

const currencyOptions = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

const PRIMARY_COLOR = '#01358c';
const LOGO_URL = '/assets/vetqure.png';
const SEAL_URL = '/assets/seal.png';
const SIGNATURE_URL = '/assets/signature.png';

const payslipHtmlTemplate = ({ employee, payslip }) => `
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; background: #fff; color: #222; padding: 40px 48px; border-radius: 12px; border: 1px solid #eee;">
    <div style="display: flex; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 24px; margin-bottom: 40px;">
      <img src="${LOGO_URL}" alt="Vetqure Logo" style="height: 56px; margin-right: 32px;" />
      <div style="text-align: left;">
        <div style="font-weight: 700; font-size: 2rem; color: ${PRIMARY_COLOR}; margin-bottom: 2px;">VAMS Veterinary Consultancy Private Limited</div>
        <div style="font-size: 15px; color: #888;">KRA-113, Kedaram Nagar, Pattom, Trivandrum</div>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-weight: 700; font-size: 28px; color: ${PRIMARY_COLOR}; letter-spacing: 1px;">Salary Payslip</div>
      <div style="font-size: 16px; color: #444; margin-top: 4px;">${formatMonthYear(payslip.date)}</div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
      <div>
        <div style="font-weight: 700; color: ${PRIMARY_COLOR}; margin-bottom: 4px;">Employee</div>
        <div style="font-weight: 500;">${employee.firstName} ${employee.lastName}</div>
        <div style="font-size: 14px; color: #444;">VAMS ID: <b>${employee.vamsId}</b></div>
        <div style="font-size: 14px; color: #444;">Role: <b>${employee.role}</b></div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: ${PRIMARY_COLOR}; margin-bottom: 4px;">Payslip Details</div>
        <div style="font-size: 14px; color: #444;">Date: <b>${formatMonthYear(payslip.date)}</b></div>
        <div style="font-size: 14px; color: #444;">Mode: <b>${payslip.modeOfPayment}</b></div>
        <div style="font-size: 14px; color: #444;">Txn Ref: <b>${payslip.transactionRef}</b></div>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead>
        <tr>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: left; font-weight: 700; font-size: 15px;">Component</th>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: right; font-weight: 700; font-size: 15px;">Amount (${currencySymbol(payslip.currency)})</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">Basic Salary</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencySymbol(payslip.currency)} ${formatAmount(payslip.breakdown.basic)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">HRA</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencySymbol(payslip.currency)} ${formatAmount(payslip.breakdown.hra)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">Conveyance Allowance</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencySymbol(payslip.currency)} ${formatAmount(payslip.breakdown.conveyance)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">Special Allowance</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencySymbol(payslip.currency)} ${formatAmount(payslip.breakdown.special)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: ${PRIMARY_COLOR}; font-size: 16px; border-top: 2px solid #eee;">Total Earnings</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: ${PRIMARY_COLOR}; font-size: 16px; border-top: 2px solid #eee;">${currencySymbol(payslip.currency)} ${formatAmount(payslip.breakdown.total)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: 48px;">
      <div style="display: flex; flex-direction: column; align-items: center;">
        <img src="${SEAL_URL}" alt="Company Seal" style="height: 120px; width: 120px; margin-bottom: 8px; opacity: 0.85;" />
        <div style="font-size: 13px; color: #888; margin-top: 2px;">Company Seal</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; margin-right: 24px;">
        <img src="${SIGNATURE_URL}" alt="Signature" style="height: 48px; width: 120px; margin-bottom: 2px; opacity: 0.95;" />
        <div style="font-size: 13px; color: #888;">Authorised Signatory</div>
      </div>
    </div>
    <div style="color: #888; font-size: 12px; border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; text-align: center;">
      This is a computer generated payslip and does not require a physical signature.<br />VAMS Veterinary Consultancy Private Limited
    </div>
  </div>
`;

function currencySymbol(code: string) {
  switch (code) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return code || '₹';
  }
}

function formatAmount(amount: any) {
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonthYear(date: string) {
  if (!date) return '';
  const [year, month] = date.split('-');
  if (!year || !month) return date;
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

const GeneratePayslipDialog: React.FC<GeneratePayslipDialogProps> = ({ open, onOpenChange, employee }) => {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [transactionRef, setTransactionRef] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Bank Transfer');
  const [breakdown, setBreakdown] = useState({
    basic: 0,
    hra: 0,
    conveyance: 0,
    special: 0,
    total: 0,
  });

  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    const basic = Math.round(amt * defaultBreakdownPercents.basic);
    const hra = Math.round(amt * defaultBreakdownPercents.hra);
    const conveyance = Math.round(amt * defaultBreakdownPercents.conveyance);
    const special = amt - (basic + hra + conveyance);
    setBreakdown({
      basic,
      hra,
      conveyance,
      special,
      total: basic + hra + conveyance + special,
    });
  }, [amount]);

  const handleClose = () => {
    setDate('');
    setAmount('');
    setCurrency('INR');
    setTransactionRef('');
    setModeOfPayment('Bank Transfer');
    setBreakdown({ basic: 0, hra: 0, conveyance: 0, special: 0, total: 0 });
    onOpenChange(false);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    const payslip = {
      date,
      amount: parseFloat(amount),
      currency,
      transactionRef,
      modeOfPayment,
      breakdown,
    };
    const html = payslipHtmlTemplate({ employee, payslip });
    const element = document.createElement('div');
    element.innerHTML = html;
    html2pdf().from(element).toPdf().get('pdf').then(function(pdf) {
      window.open(pdf.output('bloburl'), '_blank');
    });
    handleClose();
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[50vw] max-w-[95vw] max-h-[80vh] overflow-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold">Generate Payslip</DialogTitle>
          <DialogDescription className="text-gray-500 text-sm mt-1">
            Fill out the details to generate a payslip for <span className="font-semibold text-blue-700">{employee.firstName} {employee.lastName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payslip Date</label>
              <Input type="month" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <select className="w-full border rounded px-3 py-2" value={currency} onChange={e => setCurrency(e.target.value)}>
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.symbol} {opt.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount</label>
              <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mode of Payment</label>
              <select className="w-full border rounded px-3 py-2" value={modeOfPayment} onChange={e => setModeOfPayment(e.target.value)}>
                {modeOfPaymentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Reference ID</label>
              <Input type="text" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} required />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mt-2">
            <div className="font-semibold text-gray-700 mb-2">Salary Breakdown</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Basic Salary</div>
              <div className="text-right font-medium">{currencyOptions.find(c => c.code === currency)?.symbol}{' '}{breakdown.basic.toLocaleString()}</div>
              <div>HRA</div>
              <div className="text-right font-medium">{currencyOptions.find(c => c.code === currency)?.symbol}{' '}{breakdown.hra.toLocaleString()}</div>
              <div>Conveyance Allowance</div>
              <div className="text-right font-medium">{currencyOptions.find(c => c.code === currency)?.symbol}{' '}{breakdown.conveyance.toLocaleString()}</div>
              <div>Special Allowance</div>
              <div className="text-right font-medium">{currencyOptions.find(c => c.code === currency)?.symbol}{' '}{breakdown.special.toLocaleString()}</div>
              <div className="font-bold">Total Earnings</div>
              <div className="text-right font-bold">{currencyOptions.find(c => c.code === currency)?.symbol}{' '}{breakdown.total.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white">Generate Payslip</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePayslipDialog; 