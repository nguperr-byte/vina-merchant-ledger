import React, { useRef, useEffect } from 'react';
import { X, Download, Share2, Receipt } from 'lucide-react';
import { Customer, Collection, Payment, Commodity } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  transaction?: {
    id: string;
    type: 'collection' | 'payment';
    date: string;
    amount: number;
    notes?: string;
    commodityId?: string; // for collections
    quantity?: number;    // for collections
    unit?: string;        // for collections
    unitPrice?: number;   // for collections
  };
  commodities: Commodity[];
}

export default function ReceiptModal({
  isOpen,
  onClose,
  customer,
  transaction,
  commodities,
}: ReceiptModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen || !transaction || !customer) return null;

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCommodityName = () => {
    if (transaction.type !== 'collection' || !transaction.commodityId) return 'N/A';
    return commodities.find(c => c.id === transaction.commodityId)?.name || 'Commodity';
  };

  const transactionDate = new Date(transaction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Function to draw and download the receipt canvas
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-resolution display size
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Clear background
    ctx.fillStyle = '#FAF6F0'; // Warm off-white
    ctx.fillRect(0, 0, width, height);

    // Header Pattern Accent Line
    ctx.fillStyle = '#C2593F'; // Terracotta
    ctx.fillRect(0, 0, width, 12);

    // Draw Vina Logo badge
    ctx.fillStyle = '#C2593F';
    // Rounded rect
    const radius = 12;
    const x = 50;
    const y = 45;
    const size = 56;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // White V text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', x + size / 2, y + size / 2);

    // Business Header Info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#231B15'; // Dark Wood
    ctx.font = '900 22px Arial, sans-serif';
    ctx.fillText('VINA LEDGER', 124, 64);
    
    ctx.fillStyle = '#D97706'; // Gold accent
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('OFFICIAL TRANSACTION RECEIPT', 124, 86);

    // Decorative dotted border
    ctx.strokeStyle = '#E6DDD0';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(width - 50, 130);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Metadata Blocks: Receipt ID & Timestamp
    ctx.fillStyle = '#8F8276';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText(`RECEIPT NO: ${transaction.id.toUpperCase()}`, 50, 155);
    
    ctx.textAlign = 'right';
    ctx.fillText(`DATE: ${new Date(transaction.date).toLocaleDateString()}`, width - 50, 155);

    // Customer Information Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FAF6F0';
    ctx.fillStyle = '#FAF6F0';
    // Grey light panel background for Customer details
    ctx.fillStyle = '#F0EAE1';
    ctx.fillRect(50, 175, width - 100, 105);
    ctx.strokeStyle = '#E6DDD0';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 175, width - 100, 105);

    ctx.fillStyle = '#8F8276';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('BILLED TO (CUSTOMER):', 65, 198);

    ctx.fillStyle = '#231B15';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(customer.name, 65, 222);

    ctx.font = 'semibold 12px Arial, sans-serif';
    ctx.fillStyle = '#5A4D41';
    ctx.fillText(`Phone: ${customer.phone}`, 65, 243);
    if (customer.workplace) {
      ctx.fillText(`Workplace: ${customer.workplace}`, 65, 260);
    }

    // Transaction Details Table Header
    ctx.fillStyle = '#231B15';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('TRANSACTION ITEM DESCRIPTION', 50, 315);
    
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL', width - 50, 315);

    ctx.strokeStyle = '#231B15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 325);
    ctx.lineTo(width - 50, 325);
    ctx.stroke();

    // Table Row Content
    ctx.textAlign = 'left';
    ctx.fillStyle = '#231B15';
    
    if (transaction.type === 'collection') {
      // Row 1: Stock Supply Description
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(`Supply: ${getCommodityName()}`, 50, 355);
      
      // Sub-details (Qty x Rate)
      ctx.font = 'italic 12px Arial, sans-serif';
      ctx.fillStyle = '#5A4D41';
      ctx.fillText(
        `${transaction.quantity} ${transaction.unit} x ${formatNaira(transaction.unitPrice || 0)} / unit`, 
        50, 
        378
      );

      ctx.textAlign = 'right';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillStyle = '#231B15';
      ctx.fillText(formatNaira(transaction.amount), width - 50, 355);
    } else {
      // Repayment receipt
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText('Direct Ledger Repayment (Credit Settlement)', 50, 355);
      
      ctx.font = 'italic 12px Arial, sans-serif';
      ctx.fillStyle = '#5A4D41';
      ctx.fillText('Cash/Transfer payment credited to outstanding ledger', 50, 378);

      ctx.textAlign = 'right';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillStyle = '#231B15';
      ctx.fillText(formatNaira(transaction.amount), width - 50, 355);
    }

    // Divider after row
    ctx.strokeStyle = '#E6DDD0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 400);
    ctx.lineTo(width - 50, 400);
    ctx.stroke();

    // Notes Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8F8276';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('TRANSACTION MEMO / NOTES:', 50, 430);
    
    ctx.fillStyle = '#5A4D41';
    ctx.font = 'medium italic 12px Arial, sans-serif';
    const notesText = transaction.notes || 'No delivery comments noted.';
    // Simple wrap text for notes (up to 2 lines)
    if (notesText.length > 70) {
      ctx.fillText(notesText.substring(0, 70) + '...', 50, 450);
    } else {
      ctx.fillText(notesText, 50, 450);
    }

    // Grand Summary Terracotta Box
    ctx.fillStyle = '#C2593F'; // Terracotta banner
    ctx.fillRect(50, 490, width - 100, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(transaction.type === 'collection' ? 'TOTAL OUTSTANDING CHARGED TO DEBT LEDGER' : 'TOTAL PAYMENT RECEIVED & CLEARED', 70, 520);

    ctx.textAlign = 'right';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(formatNaira(transaction.amount), width - 70, 538);

    // Seal of Authenticity / Signature Line
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FAF6F0';
    // Draw fine stamp border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(50, 605, 150, 70);
    ctx.setLineDash([]); // reset

    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('VINA MERCHANT', 60, 625);
    ctx.fillText('LEDGER OFFICE', 60, 638);
    
    ctx.fillStyle = '#5A4D41';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillText('Verified Ledger', 60, 663);

    // Date/Time footer stamp
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8F8276';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('DATE RECORDED', width - 50, 620);
    ctx.fillStyle = '#231B15';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(new Date(transaction.date).toLocaleDateString(), width - 50, 640);
    ctx.font = '9px Arial, sans-serif';
    ctx.fillStyle = '#8F8276';
    ctx.fillText(new Date(transaction.date).toLocaleTimeString(), width - 50, 655);

    // Dotted bottom line
    ctx.strokeStyle = '#E6DDD0';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 715);
    ctx.lineTo(width - 50, 715);
    ctx.stroke();
    ctx.setLineDash([]);

    // Footer copyright
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8F8276';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('THANK YOU FOR YOUR PATRONAGE! KEEP YOUR LEDGERS ACCURATE.', width / 2, 745);
    ctx.font = '8px Arial, sans-serif';
    ctx.fillText('Powered by Vina Offline Ledger Manager Engine', width / 2, 760);

    // Save image to browser
    const link = document.createElement('a');
    link.download = `vina_receipt_${transaction.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Hidden canvas for drawing and saving */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="bg-[#FAF6F0] rounded-2xl max-w-lg w-full border border-[#E6DDD0] shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header Controls */}
        <div className="bg-[#231B15] text-[#FAF6F0] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D97706]" />
            <span className="text-xs font-black uppercase tracking-wider font-serif">Aesthetic Receipt Preview</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Styled Layout Content (Exactly identical visually to downloaded image) */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh] text-[#231B15] font-sans">
          
          <div className="border-t-4 border-[#C2593F] pt-4 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#C2593F] rounded-xl flex items-center justify-center text-white font-black text-lg font-serif shadow shadow-[#C2593F]/20">
                V
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-tight font-serif text-[#231B15]">VINA LEDGER</h2>
                <span className="text-[10px] text-[#D97706] font-black tracking-wider uppercase">Official Receipt</span>
              </div>
            </div>

            <div className="text-right text-[10px] font-black text-slate-400 tracking-wider">
              <p>RECEIPT #: {transaction.id.toUpperCase().substring(0, 10)}...</p>
              <p className="mt-1">DATE: {new Date(transaction.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-[#F0EAE1] p-4 rounded-xl border border-[#E6DDD0] space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Billed To (Customer)</span>
            <div>
              <h3 className="font-extrabold text-[#231B15] text-sm">{customer.name}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Phone: {customer.phone}</p>
              {customer.workplace && (
                <p className="text-xs text-slate-500 font-semibold">Workplace: {customer.workplace}</p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-[#E6DDD0]">
              <span>Description</span>
              <span>Total</span>
            </div>

            <div className="flex justify-between items-start text-xs">
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#231B15]">
                  {transaction.type === 'collection' ? `Supply: ${getCommodityName()}` : 'Direct Ledger Repayment'}
                </span>
                <p className="text-[11px] text-slate-500 font-medium italic">
                  {transaction.type === 'collection' 
                    ? `${transaction.quantity} ${transaction.unit} x ${formatNaira(transaction.unitPrice || 0)} / unit`
                    : 'Repayment credited to outstanding ledger'}
                </p>
              </div>
              <span className="font-black text-[#231B15]">{formatNaira(transaction.amount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-100/80">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Notes / Memo</span>
              <p className="text-xs text-slate-600 font-medium italic mt-0.5">
                {transaction.notes || 'No transaction notes logged.'}
              </p>
            </div>
          </div>

          {/* Saffron Highlights Summary */}
          <div className="bg-[#C2593F] text-white p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-orange-200">
                {transaction.type === 'collection' ? 'Outstanding Debt Charged' : 'Amount Cleared / Received'}
              </span>
              <h4 className="text-2xl font-extrabold tracking-tight font-serif text-white mt-1">
                {formatNaira(transaction.amount)}
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 border border-white/20 px-2.5 py-1 rounded-md">
              {transaction.type === 'collection' ? 'DEBT ACCRUED' : 'PAID'}
            </span>
          </div>

          {/* Footer Seals */}
          <div className="pt-4 border-t border-[#E6DDD0] flex justify-between items-center text-xs font-semibold">
            <div className="border border-dashed border-[#D97706]/40 p-2.5 rounded text-[10px] text-[#D97706] font-black uppercase tracking-wider text-center max-w-[150px]">
              <span className="block text-[8px] opacity-70">OFFICIAL LEDGER</span>
              <span>VERIFIED SEAL</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
              <p className="text-slate-700 font-extrabold text-[11px] mt-0.5">{transactionDate}</p>
            </div>
          </div>

        </div>

        {/* Action Bottom Bar */}
        <div className="bg-[#FAF6F0] px-5 py-4 border-t border-[#E6DDD0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#E6DDD0] font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Preview
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 bg-[#C2593F] hover:bg-[#A84A32] text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#C2593F]/10"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download PNG Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
