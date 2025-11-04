import React from 'react';

interface PayslipPrintViewProps {
  employee: any;
  payslip: {
    date: string;
    amount: number;
    currency: string;
    transactionRef: string;
    modeOfPayment: string;
    breakdown: {
      basic: number;
      hra: number;
      conveyance: number;
      special: number;
      total: number;
    };
  };
}

const PRIMARY_COLOR = '#01358c';
const LOGO_URL = '/assets/vetqure.png';
const SEAL_URL = '/assets/seal.png';
const SIGNATURE_URL = '/assets/signature.png';

const currencySymbol = (code: string) => {
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

const formatMonthYear = (date: string) => {
  if (!date) return '';
  const [year, month] = date.split('-');
  if (!year || !month) return date;
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const PayslipPrintView: React.FC<PayslipPrintViewProps> = ({ employee, payslip }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '40px auto', background: '#fff', color: '#222', padding: '40px 48px', borderRadius: 12, border: '1px solid #eee' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: 24, marginBottom: 40 }}>
        <img src={LOGO_URL} alt="Vetqure Logo" style={{ height: 56, marginRight: 32 }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: '2rem', color: PRIMARY_COLOR, marginBottom: 2 }}>VAMS Veterinary Consultancy Private Limited</div>
          <div style={{ fontSize: 15, color: '#888' }}>KRA-113, Kedaram Nagar, Pattom, Trivandrum</div>
        </div>
      </div>
      {/* Payslip Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 28, color: PRIMARY_COLOR, letterSpacing: 1 }}>Salary Payslip</div>
        <div style={{ fontSize: 16, color: '#444', marginTop: 4 }}>{formatMonthYear(payslip.date)}</div>
      </div>
      {/* Employee & Payslip Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontWeight: 700, color: PRIMARY_COLOR, marginBottom: 4 }}>Employee</div>
          <div style={{ fontWeight: 500 }}>{employee.firstName} {employee.lastName}</div>
          <div style={{ fontSize: 14, color: '#444' }}>VAMS ID: <b>{employee.vamsId}</b></div>
          <div style={{ fontSize: 14, color: '#444' }}>Role: <b>{employee.role}</b></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: PRIMARY_COLOR, marginBottom: 4 }}>Payslip Details</div>
          <div style={{ fontSize: 14, color: '#444' }}>Date: <b>{formatMonthYear(payslip.date)}</b></div>
          <div style={{ fontSize: 14, color: '#444' }}>Mode: <b>{payslip.modeOfPayment}</b></div>
          <div style={{ fontSize: 14, color: '#444' }}>Txn Ref: <b>{payslip.transactionRef}</b></div>
        </div>
      </div>
      {/* Salary Breakdown Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'left', fontWeight: 700, fontSize: 15 }}>Component</th>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>Amount ({currencySymbol(payslip.currency)})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Basic Salary</td>
            <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{currencySymbol(payslip.currency)} {formatAmount(payslip.breakdown.basic)}</td>
          </tr>
          <tr>
            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>HRA</td>
            <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{currencySymbol(payslip.currency)} {formatAmount(payslip.breakdown.hra)}</td>
          </tr>
          <tr>
            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Conveyance Allowance</td>
            <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{currencySymbol(payslip.currency)} {formatAmount(payslip.breakdown.conveyance)}</td>
          </tr>
          <tr>
            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Special Allowance</td>
            <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{currencySymbol(payslip.currency)} {formatAmount(payslip.breakdown.special)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: PRIMARY_COLOR, fontSize: 16, borderTop: '2px solid #eee' }}>Total Earnings</td>
            <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: PRIMARY_COLOR, fontSize: 16, borderTop: '2px solid #eee' }}>{currencySymbol(payslip.currency)} {formatAmount(payslip.breakdown.total)}</td>
          </tr>
        </tfoot>
      </table>
      {/* Footer: Seal, Signature, Print */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={SEAL_URL} alt="Company Seal" style={{ height: 120, width: 120, marginBottom: 8, opacity: 0.85 }} />
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Company Seal</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 24 }}>
          <img src={SIGNATURE_URL} alt="Signature" style={{ height: 48, width: 120, marginBottom: 2, opacity: 0.95 }} />
          <div style={{ fontSize: 13, color: '#888' }}>Authorised Signatory</div>
        </div>
        <button
          onClick={() => window.print()}
          style={{ background: PRIMARY_COLOR, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #01358c22' }}
        >
          Print
        </button>
      </div>
      <div style={{ color: '#888', fontSize: 12, borderTop: '1px solid #eee', marginTop: 32, paddingTop: 16, textAlign: 'center' }}>
        This is a computer generated payslip and does not require a physical signature.<br />VAMS Veterinary Consultancy Private Limited
      </div>
    </div>
  );
};

export default PayslipPrintView; 