import React, { useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  DollarSign, 
  TrendingDown, 
  Plus, 
  Trash2,
  Filter,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Customer, Request, Collection, Payment, Expenditure, Commodity } from '../types';
import ReceiptModal from './ReceiptModal';

interface TransactionsProps {
  customers: Customer[];
  commodities: Commodity[];
  requests: Request[];
  collections: Collection[];
  payments: Payment[];
  expenditures: Expenditure[];
  onAddRequest: (req: Omit<Request, 'id' | 'status'>) => void;
  onAddCollection: (col: Omit<Collection, 'id' | 'totalAmount'>) => void;
  onAddPayment: (pay: Omit<Payment, 'id'>) => void;
  onAddExpenditure: (exp: Omit<Expenditure, 'id'>) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCollection: (id: string) => void;
  onDeletePayment: (id: string) => void;
  onDeleteExpenditure: (id: string) => void;
  defaultFormType?: 'request' | 'collection' | 'payment' | 'expense' | 'note';
  onAddCommodity: (commodity: Omit<Commodity, 'id'>) => Commodity;
}

export default function Transactions({
  customers,
  commodities,
  requests,
  collections,
  payments,
  expenditures,
  onAddRequest,
  onAddCollection,
  onAddPayment,
  onAddExpenditure,
  onDeleteRequest,
  onDeleteCollection,
  onDeletePayment,
  onDeleteExpenditure,
  defaultFormType = 'request',
  onAddCommodity,
}: TransactionsProps) {
  
  // Navigation tabs inside Transactions view
  const [activeTab, setActiveTab] = useState<'log' | 'ledger'>('log');
  const [formType, setFormType] = useState<'request' | 'collection' | 'payment' | 'expense'>(
    defaultFormType === 'note' ? 'request' : defaultFormType as any
  );

  // Filters for ledger
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'collection' | 'payment' | 'expenditure'>('all');

  // Unified status messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Receipt modal state
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<{
    id: string;
    type: 'collection' | 'payment';
    date: string;
    amount: number;
    notes?: string;
    commodityId?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    customerId?: string;
  } | null>(null);

  // Custom Commodity Toggle and Form states
  const [isCustomReq, setIsCustomReq] = useState(false);
  const [customReqName, setCustomReqName] = useState('');
  const [customReqUnit, setCustomReqUnit] = useState('Bag (50kg)');
  const [customReqPrice, setCustomReqPrice] = useState<number | ''>(30000);

  const [isCustomCol, setIsCustomCol] = useState(false);
  const [customColName, setCustomColName] = useState('');
  const [customColUnit, setCustomColUnit] = useState('Bag (50kg)');
  const [customColPrice, setCustomColPrice] = useState<number | ''>(30000);

  const [isCustomExp, setIsCustomExp] = useState(false);
  const [customExpName, setCustomExpName] = useState('');
  const [customExpUnit, setCustomExpUnit] = useState('Bag (50kg)');
  const [customExpPrice, setCustomExpPrice] = useState<number | ''>(30000);

  // Form states - Request
  const [reqCustomer, setReqCustomer] = useState(customers[0]?.id || '');
  const [reqCommodity, setReqCommodity] = useState(commodities[0]?.id || '');
  const [reqQty, setReqQty] = useState<number | ''>(1);
  const [reqUnit, setReqUnit] = useState(commodities[0]?.defaultUnit || 'Bag (50kg)');
  const [reqNotes, setReqNotes] = useState('');

  // Form states - Collection
  const [colCustomer, setColCustomer] = useState(customers[0]?.id || '');
  const [colCommodity, setColCommodity] = useState(commodities[0]?.id || '');
  const [colQty, setColQty] = useState<number | ''>(1);
  const [colUnit, setColUnit] = useState(commodities[0]?.defaultUnit || 'Bag (50kg)');
  const [colUnitPrice, setColUnitPrice] = useState<number | ''>(commodities[0]?.defaultPrice || 32000);
  const [colNotes, setColNotes] = useState('');

  // Form states - Payment
  const [payCustomer, setPayCustomer] = useState(customers[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number | ''>(0);
  const [payNotes, setPayNotes] = useState('');

  // Form states - Expenditure
  const [expType, setExpType] = useState<'stock_cost' | 'transport' | 'loading' | 'misc'>('stock_cost');
  const [expAmount, setExpAmount] = useState<number | ''>(0);
  const [expNotes, setExpNotes] = useState('');
  const [expCommodity, setExpCommodity] = useState('');

  // Custom confirmation modal state for ledger deletion
  const [ledgerItemToDelete, setLedgerItemToDelete] = useState<{ id: string; type: 'collection' | 'payment' | 'expenditure'; title: string } | null>(null);

  // Helpers
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const showToast = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  // Submit Handlers
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCustomer) return;

    let targetCommodityId = reqCommodity;
    let targetUnit = reqUnit;

    if (isCustomReq) {
      if (!customReqName.trim()) return;
      const existing = commodities.find(c => c.name.toLowerCase() === customReqName.trim().toLowerCase());
      if (existing) {
        targetCommodityId = existing.id;
        targetUnit = existing.defaultUnit;
      } else {
        const newCom = onAddCommodity({
          name: customReqName.trim(),
          defaultUnit: customReqUnit.trim() || 'Bag (50kg)',
          defaultPrice: Number(customReqPrice) || 0,
        });
        targetCommodityId = newCom.id;
        targetUnit = newCom.defaultUnit;
      }
    } else {
      if (!reqCommodity) return;
    }

    onAddRequest({
      customerId: reqCustomer,
      commodityId: targetCommodityId,
      quantity: Number(reqQty) || 1,
      unit: targetUnit,
      date: new Date().toISOString(),
      notes: reqNotes,
    });
    setReqNotes('');
    setCustomReqName('');
    setIsCustomReq(false);
    showToast('Customer demand request logged successfully!');
  };

  const handleCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colCustomer) return;

    let targetCommodityId = colCommodity;
    let targetUnit = colUnit;
    let targetUnitPrice = Number(colUnitPrice) || 0;

    if (isCustomCol) {
      if (!customColName.trim()) return;
      const existing = commodities.find(c => c.name.toLowerCase() === customColName.trim().toLowerCase());
      if (existing) {
        targetCommodityId = existing.id;
        targetUnit = existing.defaultUnit;
        targetUnitPrice = existing.defaultPrice;
      } else {
        const newCom = onAddCommodity({
          name: customColName.trim(),
          defaultUnit: customColUnit.trim() || 'Bag (50kg)',
          defaultPrice: Number(customColPrice) || 0,
        });
        targetCommodityId = newCom.id;
        targetUnit = newCom.defaultUnit;
        targetUnitPrice = Number(customColPrice) || 0;
      }
    } else {
      if (!colCommodity) return;
    }

    onAddCollection({
      customerId: colCustomer,
      commodityId: targetCommodityId,
      quantity: Number(colQty) || 1,
      unit: targetUnit,
      unitPrice: targetUnitPrice,
      date: new Date().toISOString(),
      notes: colNotes,
    });
    setColNotes('');
    setCustomColName('');
    setIsCustomCol(false);
    showToast('Inventory collection/supply logged successfully!');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(payAmount) || 0;
    if (!payCustomer || parsedAmount <= 0) return;
    onAddPayment({
      customerId: payCustomer,
      amount: parsedAmount,
      date: new Date().toISOString(),
      notes: payNotes,
    });
    setPayAmount(0);
    setPayNotes('');
    showToast('Customer payment received and balanced!');
  };

  const handleExpenditureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(expAmount) || 0;
    if (parsedAmount <= 0) return;

    let targetCommodityId = expCommodity;

    if (isCustomExp) {
      if (customExpName.trim()) {
        const existing = commodities.find(c => c.name.toLowerCase() === customExpName.trim().toLowerCase());
        if (existing) {
          targetCommodityId = existing.id;
        } else {
          const newCom = onAddCommodity({
            name: customExpName.trim(),
            defaultUnit: customExpUnit.trim() || 'Bag (50kg)',
            defaultPrice: Number(customExpPrice) || 0,
          });
          targetCommodityId = newCom.id;
        }
      }
    }

    onAddExpenditure({
      type: expType,
      amount: parsedAmount,
      date: new Date().toISOString(),
      notes: expNotes,
      commodityId: targetCommodityId || undefined
    });
    setExpAmount(0);
    setExpNotes('');
    setCustomExpName('');
    setIsCustomExp(false);
    showToast('Business expenditure logged successfully!');
  };

  // Compile full sorted general ledger
  const getUnifiedLedger = () => {
    const list: any[] = [];

    if (ledgerFilter === 'all' || ledgerFilter === 'collection') {
      collections.forEach((item) => {
        list.push({
          id: item.id,
          type: 'collection' as const,
          category: 'Supply',
          title: customers.find(c => c.id === item.customerId)?.name || 'Unknown',
          detail: `${item.quantity} ${item.unit} of ${commodities.find(c => c.id === item.commodityId)?.name || 'Stock'}`,
          amount: item.totalAmount,
          date: item.date,
          color: 'emerald'
        });
      });
    }

    if (ledgerFilter === 'all' || ledgerFilter === 'payment') {
      payments.forEach((item) => {
        list.push({
          id: item.id,
          type: 'payment' as const,
          category: 'Payment',
          title: customers.find(c => c.id === item.customerId)?.name || 'Unknown',
          detail: item.notes || 'Repayment',
          amount: item.amount,
          date: item.date,
          color: 'blue'
        });
      });
    }

    if (ledgerFilter === 'all' || ledgerFilter === 'expenditure') {
      expenditures.forEach((item) => {
        list.push({
          id: item.id,
          type: 'expenditure' as const,
          category: item.type.toUpperCase().replace('_', ' '),
          title: 'Business Expense',
          detail: item.notes || 'Operating cost',
          amount: item.amount,
          date: item.date,
          color: 'rose'
        });
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleDeleteLedgerItem = (id: string, type: 'collection' | 'payment' | 'expenditure') => {
    const rawLedgerList = getUnifiedLedger();
    const item = rawLedgerList.find(x => x.id === id && x.type === type);
    setLedgerItemToDelete({
      id,
      type,
      title: item ? `${item.category}: ${item.title} (${item.detail})` : 'this ledger entry'
    });
  };

  return (
    <div id="transactions-view-container" className="space-y-6">
      
      {/* View Header Tabs */}
      <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-xs">
        <button
          id="txn-subtab-log"
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
            activeTab === 'log' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Add Ledger Entry
        </button>
        <button
          id="txn-subtab-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
            activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Unified Ledger Logs
        </button>
      </div>

      {/* Success Notification Toast */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* -------------------- ADD ENTRY FORM VIEW -------------------- */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          
          {/* Form Selector */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <button
              id="form-sel-request"
              onClick={() => setFormType('request')}
              className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${formType === 'request' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Request
            </button>
            <button
              id="form-sel-collection"
              onClick={() => setFormType('collection')}
              className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${formType === 'collection' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Supply
            </button>
            <button
              id="form-sel-payment"
              onClick={() => setFormType('payment')}
              className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${formType === 'payment' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Payment
            </button>
            <button
              id="form-sel-expense"
              onClick={() => setFormType('expense')}
              className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${formType === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Expense
            </button>
          </div>

          {/* Form Content */}
          {formType === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs font-semibold">
              <div className="border-l-4 border-amber-500 pl-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Demand Request</h2>
                <p className="text-slate-400 text-[10px]">Record a customer's standing request before you supply.</p>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Select Customer</label>
                <select
                  id="form-req-customer"
                  value={reqCustomer}
                  onChange={(e) => setReqCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-500">Commodity Demanded</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomReq(!isCustomReq)}
                    className="text-[10px] font-black uppercase text-[#00B875] hover:underline cursor-pointer"
                  >
                    {isCustomReq ? '← Select from Catalog' : '+ Add Custom Commodity'}
                  </button>
                </div>
                {isCustomReq ? (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3 mb-2">
                    <div className="flex items-center gap-1 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span>Create Custom Commodity On-the-fly</span>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-0.5">Commodity Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. White Garri, Palm Oil, Cocoa"
                        required={isCustomReq}
                        value={customReqName}
                        onChange={(e) => setCustomReqName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Default Unit *</label>
                        <input
                          type="text"
                          placeholder="e.g. Bag (50kg)"
                          required={isCustomReq}
                          value={customReqUnit}
                          onChange={(e) => setCustomReqUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Standard Price (₦) *</label>
                        <input
                          type="number"
                          placeholder="30000"
                          required={isCustomReq}
                          value={customReqPrice}
                          onChange={(e) => setCustomReqPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    id="form-req-commodity"
                    value={reqCommodity}
                    onChange={(e) => {
                      const sel = commodities.find(c => c.id === e.target.value);
                      setReqCommodity(e.target.value);
                      if (sel) setReqUnit(sel.defaultUnit);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="">-- Choose Commodity --</option>
                    {commodities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    id="form-req-qty"
                    type="number"
                    min="1"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Measurement Unit</label>
                  <input
                    id="form-req-unit"
                    type="text"
                    required
                    placeholder="e.g. Bag, Mudu"
                    value={isCustomReq ? customReqUnit : reqUnit}
                    onChange={(e) => {
                      if (isCustomReq) {
                        setCustomReqUnit(e.target.value);
                      } else {
                        setReqUnit(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Notes / Preferences</label>
                <input
                  id="form-req-notes"
                  type="text"
                  placeholder="e.g. Wants white white garri, deliver before July 10"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
              >
                Save Demand Request
              </button>
            </form>
          )}

          {formType === 'collection' && (
            <form onSubmit={handleCollectionSubmit} className="space-y-4 text-xs font-semibold">
              <div className="border-l-4 border-emerald-500 pl-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Supply Commodity (Credit)</h2>
                <p className="text-slate-400 text-[10px]">Record stock actually supplied to customer on credit balance.</p>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Customer</label>
                <select
                  id="form-col-customer"
                  value={colCustomer}
                  onChange={(e) => setColCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-500">Commodity Supplied</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCol(!isCustomCol)}
                    className="text-[10px] font-black uppercase text-[#00B875] hover:underline cursor-pointer"
                  >
                    {isCustomCol ? '← Select from Catalog' : '+ Add Custom Commodity'}
                  </button>
                </div>
                {isCustomCol ? (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3 mb-2">
                    <div className="flex items-center gap-1 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span>Create Custom Commodity On-the-fly</span>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-0.5">Commodity Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. White Garri, Palm Oil, Cocoa"
                        required={isCustomCol}
                        value={customColName}
                        onChange={(e) => setCustomColName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Default Unit *</label>
                        <input
                          type="text"
                          placeholder="e.g. Bag (50kg)"
                          required={isCustomCol}
                          value={customColUnit}
                          onChange={(e) => setCustomColUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Standard Price (₦) *</label>
                        <input
                          type="number"
                          placeholder="30000"
                          required={isCustomCol}
                          value={customColPrice}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                            setCustomColPrice(val);
                            setColUnitPrice(val);
                          }}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    id="form-col-commodity"
                    value={colCommodity}
                    onChange={(e) => {
                      const sel = commodities.find(c => c.id === e.target.value);
                      setColCommodity(e.target.value);
                      if (sel) {
                        setColUnit(sel.defaultUnit);
                        setColUnitPrice(sel.defaultPrice);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="">-- Choose Commodity --</option>
                    {commodities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    id="form-col-qty"
                    type="number"
                    min="1"
                    required
                    value={colQty}
                    onChange={(e) => setColQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Measurement Unit</label>
                  <input
                    id="form-col-unit"
                    type="text"
                    required
                    value={isCustomCol ? customColUnit : colUnit}
                    onChange={(e) => {
                      if (isCustomCol) {
                        setCustomColUnit(e.target.value);
                      } else {
                        setColUnit(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Unit Selling Price (₦)</label>
                <input
                  id="form-col-price"
                  type="number"
                  required
                  value={colUnitPrice}
                  onChange={(e) => setColUnitPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-emerald-800">Total Credit Owed:</span>
                <span className="text-sm font-black text-emerald-900">{formatNaira(colQty * colUnitPrice)}</span>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Delivery Notes</label>
                <input
                  id="form-col-notes"
                  type="text"
                  placeholder="e.g. Handed over white standard, white bags."
                  value={colNotes}
                  onChange={(e) => setColNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
              >
                Record Supply Credit
              </button>
            </form>
          )}

          {formType === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-semibold">
              <div className="border-l-4 border-blue-500 pl-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Receive Repayment</h2>
                <p className="text-slate-400 text-[10px]">Record money paid by customer to reduce their outstanding credit balance.</p>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Customer Paying</label>
                <select
                  id="form-pay-customer"
                  value={payCustomer}
                  onChange={(e) => setPayCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Payment Amount (₦)</label>
                <input
                  id="form-pay-amount"
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Payment Reference / Notes</label>
                <input
                  id="form-pay-notes"
                  type="text"
                  placeholder="e.g. Cash payment / Bank transfer Zenith Bank"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
              >
                Record Payment Received
              </button>
            </form>
          )}

          {formType === 'expense' && (
            <form onSubmit={handleExpenditureSubmit} className="space-y-4 text-xs font-semibold">
              <div className="border-l-4 border-rose-500 pl-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Business Expenditure</h2>
                <p className="text-slate-400 text-[10px]">Log operational expenditures like purchase cost, transit loading, etc.</p>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Expense Type</label>
                <select
                  id="form-exp-type"
                  value={expType}
                  onChange={(e) => setExpType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="stock_cost">Stock Cost (Purchase Price)</option>
                  <option value="transport">Transport / Logistics / Fuel</option>
                  <option value="loading">Loading & Offloading Labor</option>
                  <option value="misc">Miscellaneous / Bagging / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Amount Paid (₦)</label>
                <input
                  id="form-exp-amount"
                  type="number"
                  required
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-500">Link to Commodity (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomExp(!isCustomExp)}
                    className="text-[10px] font-black uppercase text-[#00B875] hover:underline cursor-pointer"
                  >
                    {isCustomExp ? '← Select from Catalog' : '+ Add Custom Commodity'}
                  </button>
                </div>
                {isCustomExp ? (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3 mb-2">
                    <div className="flex items-center gap-1 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span>Create Custom Commodity On-the-fly</span>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-0.5">Commodity Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. White Garri, Palm Oil, Cocoa"
                        required={isCustomExp}
                        value={customExpName}
                        onChange={(e) => setCustomExpName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Default Unit *</label>
                        <input
                          type="text"
                          placeholder="e.g. Bag (50kg)"
                          required={isCustomExp}
                          value={customExpUnit}
                          onChange={(e) => setCustomExpUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-0.5">Standard Price (₦) *</label>
                        <input
                          type="number"
                          placeholder="30000"
                          required={isCustomExp}
                          value={customExpPrice}
                          onChange={(e) => setCustomExpPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    id="form-exp-commodity"
                    value={expCommodity}
                    onChange={(e) => setExpCommodity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="">-- General Expense (No specific commodity) --</option>
                    {commodities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Expense Detail / Notes</label>
                <input
                  id="form-exp-notes"
                  type="text"
                  placeholder="e.g. Paid boys at market to load 10 bags."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
              >
                Log Business Expense
              </button>
            </form>
          )}

        </div>
      )}

      {/* -------------------- UNIFIED GENERAL LEDGER LOGS VIEW -------------------- */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-1 bg-white border border-slate-100 p-1 rounded-xl shadow-xs">
              <button
                id="filter-btn-all"
                onClick={() => setLedgerFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  ledgerFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Logs
              </button>
              <button
                id="filter-btn-collection"
                onClick={() => setLedgerFilter('collection')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  ledgerFilter === 'collection' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Supplies
              </button>
              <button
                id="filter-btn-payment"
                onClick={() => setLedgerFilter('payment')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  ledgerFilter === 'payment' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Payments
              </button>
              <button
                id="filter-btn-expenditure"
                onClick={() => setLedgerFilter('expenditure')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  ledgerFilter === 'expenditure' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>

          {/* Table / Cards Ledger */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Description / Target</th>
                    <th className="py-4 px-5">Detail</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                    <th className="py-4 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {getUnifiedLedger().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        No transactions found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    getUnifiedLedger().map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/40 transition">
                        <td className="py-4 px-5 text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            item.type === 'collection' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            item.type === 'payment' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-800">
                          {item.title}
                        </td>
                        <td className="py-4 px-5 text-slate-500 max-w-xs truncate font-medium">
                          {item.detail}
                        </td>
                        <td className={`py-4 px-5 text-right font-black tabular-nums ${
                          item.type === 'expenditure' ? 'text-rose-400' : 
                          item.type === 'payment' ? 'text-blue-400' : 'text-emerald-400'
                        }`}>
                          {item.type === 'expenditure' ? '-' : ''}{formatNaira(item.amount)}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(item.type === 'collection' || item.type === 'payment') && (
                              <button
                                id={`ledger-receipt-btn-${item.type}-${item.id}`}
                                onClick={() => {
                                  // Find raw item
                                  const rawItem = item.type === 'collection' 
                                    ? collections.find(c => c.id === item.id)
                                    : payments.find(p => p.id === item.id);
                                  
                                  if (rawItem) {
                                    setSelectedReceiptTx({
                                      id: rawItem.id,
                                      type: item.type as 'collection' | 'payment',
                                      date: rawItem.date,
                                      amount: item.type === 'collection' ? (rawItem as Collection).totalAmount : (rawItem as Payment).amount,
                                      notes: rawItem.notes,
                                      commodityId: item.type === 'collection' ? (rawItem as Collection).commodityId : undefined,
                                      quantity: item.type === 'collection' ? (rawItem as Collection).quantity : undefined,
                                      unit: item.type === 'collection' ? (rawItem as Collection).unit : undefined,
                                      unitPrice: item.type === 'collection' ? (rawItem as Collection).unitPrice : undefined,
                                      customerId: rawItem.customerId
                                    });
                                  }
                                }}
                                className="p-1.5 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-slate-400 cursor-pointer transition"
                                title="Generate Aesthetic Receipt / Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                              </button>
                            )}
                            <button
                              id={`delete-ledger-btn-${item.type}-${item.id}`}
                              onClick={() => handleDeleteLedgerItem(item.id, item.type)}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 cursor-pointer transition"
                              title="Delete Ledger Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Dynamic Receipt Canvas & Modal Overlay */}
      <ReceiptModal 
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        customer={customers.find(c => c.id === selectedReceiptTx?.customerId)}
        transaction={selectedReceiptTx || undefined}
        commodities={commodities}
      />

      {/* Custom Delete Confirmation Modal */}
      {ledgerItemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-xl space-y-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">Delete Ledger Entry?</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to delete this ledger entry (<strong>{ledgerItemToDelete.title}</strong>)? This will re-balance your accounting values.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLedgerItemToDelete(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { id, type } = ledgerItemToDelete;
                  if (type === 'collection') onDeleteCollection(id);
                  if (type === 'payment') onDeletePayment(id);
                  if (type === 'expenditure') onDeleteExpenditure(id);
                  setLedgerItemToDelete(null);
                  showToast('Ledger entry deleted and re-balanced.');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
