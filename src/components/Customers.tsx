import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Briefcase, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Share2,
  Trash2,
  Edit2,
  Plus,
  Upload
} from 'lucide-react';
import { Customer, Request, Collection, Payment, Commodity } from '../types';
import ReceiptModal from './ReceiptModal';

interface CustomersProps {
  customers: Customer[];
  requests: Request[];
  collections: Collection[];
  payments: Payment[];
  commodities: Commodity[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onImportCustomers: (customers: Omit<Customer, 'id' | 'createdAt'>[]) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onAddRequest: (req: Omit<Request, 'id' | 'status'>) => void;
  onAddCollection: (col: Omit<Collection, 'id' | 'totalAmount'>) => void;
  onAddPayment: (pay: Omit<Payment, 'id'>) => void;
  onFulfillRequest: (reqId: string, col: Omit<Collection, 'id' | 'totalAmount'>) => void;
}

export default function Customers({
  customers,
  requests,
  collections,
  payments,
  commodities,
  onAddCustomer,
  onImportCustomers,
  onEditCustomer,
  onDeleteCustomer,
  onAddRequest,
  onAddCollection,
  onAddPayment,
  onFulfillRequest,
}: CustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);
  
  // Modals / Form toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickRequest, setShowQuickRequest] = useState(false);
  const [showQuickCollection, setShowQuickCollection] = useState(false);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [selectedRequestToFulfill, setSelectedRequestToFulfill] = useState<Request | null>(null);

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Omit<Customer, 'id' | 'createdAt'>[]>([]);

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
  } | null>(null);

  const parseCSV = (text: string): Omit<Customer, 'id' | 'createdAt'>[] => {
    const lines = text.split(/\r?\n/);
    const result: Omit<Customer, 'id' | 'createdAt'>[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      
      // Skip header
      if (i === 0 && (cells[0].toLowerCase().includes('name') || cells[1]?.toLowerCase().includes('phone'))) {
        continue;
      }
      
      if (cells[0]) {
        result.push({
          name: cells[0],
          phone: cells[1] || '',
          workplace: cells[2] || '',
          notes: cells[3] || ''
        });
      }
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      const parsed = parseCSV(text);
      setImportPreview(parsed);
      if (parsed.length === 0) {
        setImportError("No customers detected. Ensure format is Name, Phone, Workplace, Notes.");
      } else {
        setImportError(null);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  // Form states - Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [notes, setNotes] = useState('');

  // Form states - Transactions for selected customer
  const [reqCommodity, setReqCommodity] = useState('');
  const [reqQty, setReqQty] = useState<number | ''>(1);
  const [reqUnit, setReqUnit] = useState('Bag (50kg)');
  const [reqNotes, setReqNotes] = useState('');

  const [colCommodity, setColCommodity] = useState('');
  const [colQty, setColQty] = useState<number | ''>(1);
  const [colUnit, setColUnit] = useState('Bag (50kg)');
  const [colUnitPrice, setColUnitPrice] = useState<number | ''>(30000);
  const [colNotes, setColNotes] = useState('');

  const [payAmount, setPayAmount] = useState<number | ''>(0);
  const [payNotes, setPayNotes] = useState('');

  // Helpers
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCustomerBalance = (custId: string) => {
    const totalColl = collections
      .filter((item) => item.customerId === custId)
      .reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPay = payments
      .filter((item) => item.customerId === custId)
      .reduce((sum, item) => sum + item.amount, 0);
    return totalColl - totalPay;
  };

  // Filtered lists
  const filteredCustomers = customers.filter((cust) => {
    const term = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.phone.includes(term) ||
      cust.workplace.toLowerCase().includes(term)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Compile full sorted timeline history for selected customer
  const getCustomerHistory = (custId: string) => {
    const custReqs = requests
      .filter((r) => r.customerId === custId)
      .map((r) => ({
        id: r.id,
        type: 'request' as const,
        title: 'Request Logged',
        detail: `${r.quantity} ${r.unit} of ${commodities.find(c => c.id === r.commodityId)?.name || 'Commodity'}`,
        status: r.status,
        date: r.date,
        amount: null,
        raw: r
      }));

    const custCols = collections
      .filter((c) => c.customerId === custId)
      .map((c) => ({
        id: c.id,
        type: 'collection' as const,
        title: 'Inventory Collected',
        detail: `${c.quantity} ${c.unit} @ ${formatNaira(c.unitPrice)}/unit`,
        status: 'supplied',
        date: c.date,
        amount: c.totalAmount,
        raw: c
      }));

    const custPays = payments
      .filter((p) => p.customerId === custId)
      .map((p) => ({
        id: p.id,
        type: 'payment' as const,
        title: 'Payment Received',
        detail: p.notes || 'Repayment',
        status: 'paid',
        date: p.date,
        amount: p.amount,
        raw: p
      }));

    return [...custReqs, ...custCols, ...custPays].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Submit Handlers
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onAddCustomer({ name, phone, workplace, notes });
    setName('');
    setPhone('');
    setWorkplace('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    onEditCustomer({
      ...selectedCustomer,
      name,
      phone,
      workplace,
      notes,
    });
    setShowEditModal(false);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !reqCommodity) return;
    onAddRequest({
      customerId: selectedCustomerId,
      commodityId: reqCommodity,
      quantity: Number(reqQty) || 1,
      unit: reqUnit,
      date: new Date().toISOString(),
      notes: reqNotes,
    });
    setReqNotes('');
    setShowQuickRequest(false);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !colCommodity) return;
    onAddCollection({
      customerId: selectedCustomerId,
      commodityId: colCommodity,
      quantity: Number(colQty) || 1,
      unit: colUnit,
      unitPrice: Number(colUnitPrice) || 0,
      date: new Date().toISOString(),
      notes: colNotes,
    });
    setColNotes('');
    setShowQuickCollection(false);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(payAmount) || 0;
    if (!selectedCustomerId || parsedAmount <= 0) return;
    onAddPayment({
      customerId: selectedCustomerId,
      amount: parsedAmount,
      date: new Date().toISOString(),
      notes: payNotes,
    });
    setPayAmount(0);
    setPayNotes('');
    setShowQuickPayment(false);
  };

  // Fullfill standard pending request
  const triggerFulfillModal = (req: Request) => {
    const com = commodities.find(c => c.id === req.commodityId);
    setSelectedRequestToFulfill(req);
    setColCommodity(req.commodityId);
    setColQty(req.quantity);
    setColUnit(req.unit);
    setColUnitPrice(com?.defaultPrice || 30000);
    setColNotes(`Fulfilling request from ${new Date(req.date).toLocaleDateString()}`);
  };

  const submitFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestToFulfill || !selectedCustomerId) return;
    
    onFulfillRequest(selectedRequestToFulfill.id, {
      customerId: selectedCustomerId,
      commodityId: colCommodity,
      quantity: Number(colQty) || 1,
      unit: colUnit,
      unitPrice: Number(colUnitPrice) || 0,
      date: new Date().toISOString(),
      notes: colNotes,
    });

    setSelectedRequestToFulfill(null);
    setColNotes('');
  };

  // Share text builder
  const shareReminder = (cust: Customer) => {
    const bal = getCustomerBalance(cust.id);
    const message = `Hello ${cust.name}, this is a gentle reminder from Vina. Your current outstanding balance for supplies received is ${formatNaira(bal)}. Kindly verify and make payments towards your account. Thank you for your continued business!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Payment Reminder',
        text: message,
      }).catch(err => console.log(err));
    } else {
      // Copy backup
      navigator.clipboard.writeText(message);
      alert('Reminder message copied to clipboard! You can paste it directly into WhatsApp or SMS.');
    }
  };

  return (
    <div id="customers-view-container" className="space-y-6">
      
      {/* -------------------- PROFILE VIEW -------------------- */}
      {selectedCustomerId && selectedCustomer ? (
        <div id="customer-profile-view" className="space-y-6">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <button
              id="back-to-customers-btn"
              onClick={() => setSelectedCustomerId(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs bg-white border border-slate-100 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customers</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="edit-customer-btn"
                onClick={() => {
                  setName(selectedCustomer.name);
                  setPhone(selectedCustomer.phone);
                  setWorkplace(selectedCustomer.workplace);
                  setNotes(selectedCustomer.notes);
                  setShowEditModal(true);
                }}
                className="p-2 text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer shadow-sm transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              <button
                id="delete-customer-btn"
                onClick={() => setCustomerToDeleteId(selectedCustomer.id)}
                className="p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer shadow-sm transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Card Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-100">
                  Customer Profile
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{selectedCustomer.name}</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2 hover:text-amber-600">
                  <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span>{selectedCustomer.phone}</span>
                </a>
                
                {selectedCustomer.workplace && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <span>{selectedCustomer.workplace}</span>
                  </div>
                )}
              </div>

              {selectedCustomer.notes && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Business Notes</span>
                  <p className="text-slate-600 text-xs italic mt-1 font-medium">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Credit Balance Box */}
            <div className="md:col-span-4 bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-inner">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Outstanding Debt</span>
                <div className="flex items-center gap-2">
                  <button
                    id="profile-wa-reminder"
                    onClick={() => {
                      const bal = getCustomerBalance(selectedCustomer.id);
                      if (bal <= 0) return;
                      const cleanPhone = selectedCustomer.phone.replace(/[^0-9+]/g, '');
                      let formattedPhone = cleanPhone;
                      if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
                        formattedPhone = `234${cleanPhone.slice(1)}`;
                      }
                      const text = encodeURIComponent(`Hello ${selectedCustomer.name}, here is your current Vina outstanding balance: ${formatNaira(bal)}. Kindly verify and make payments towards your account. Thank you!`);
                      window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
                    }}
                    className="p-1.5 bg-[#2E5A44]/30 hover:bg-[#2E5A44]/50 rounded-lg text-emerald-400 cursor-pointer hover:scale-105 transition border border-[#2E5A44]/40"
                    title="Send WhatsApp Balance Message"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.115.953 11.5.951c-5.44 0-9.865 4.371-9.869 9.8-.001 2.02.535 3.997 1.553 5.761l-1.018 3.72 3.841-.996zM17.15 14.54c-.282-.141-1.67-.82-1.929-.914-.26-.094-.449-.141-.639.141-.19.282-.734.914-.9 1.103-.165.19-.33.213-.611.072-1.393-.696-2.298-1.127-3.21-2.695-.24-.411.24-.382.687-1.275.076-.142.038-.266-.019-.382-.056-.113-.449-1.082-.615-1.482-.162-.392-.326-.34-.449-.346-.116-.006-.248-.007-.38-.007s-.347.049-.529.247c-.182.198-.694.678-.694 1.654s.71 1.916.81 2.048c.099.133 1.398 2.132 3.387 2.99.473.204.842.326 1.129.418.475.152.907.13 1.25.079.382-.057 1.67-.682 1.905-1.34.234-.658.234-1.221.164-1.34-.07-.119-.26-.19-.541-.331z"/>
                    </svg>
                  </button>
                  <button
                    id="profile-share-reminder"
                    onClick={() => shareReminder(selectedCustomer)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-500 cursor-pointer hover:scale-105 transition"
                    title="Send Repayment Reminder"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-2xl font-black text-amber-400 tracking-tight">
                  {formatNaira(getCustomerBalance(selectedCustomer.id))}
                </h3>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">
                  Accrued credit ledger total
                </p>
              </div>
            </div>
          </div>

          {/* Core Profile Transaction Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              id="add-profile-request-btn"
              onClick={() => {
                if (commodities.length > 0) setReqCommodity(commodities[0].id);
                setShowQuickRequest(true);
              }}
              className="flex items-center justify-center gap-1.5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Request</span>
            </button>

            <button
              id="add-profile-supply-btn"
              onClick={() => {
                if (commodities.length > 0) {
                  setColCommodity(commodities[0].id);
                  setColUnitPrice(commodities[0].defaultPrice);
                }
                setShowQuickCollection(true);
              }}
              className="flex items-center justify-center gap-1.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Supply Stock</span>
            </button>

            <button
              id="add-profile-payment-btn"
              onClick={() => {
                setPayAmount(getCustomerBalance(selectedCustomer.id));
                setShowQuickPayment(true);
              }}
              className="flex items-center justify-center gap-1.5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>Log Payment</span>
            </button>
          </div>

          {/* Timeline Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-5">
              Ledger Timeline
            </h2>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {getCustomerHistory(selectedCustomer.id).length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">
                  No activity history for this customer. Use buttons above to log supplies, requests, or payments.
                </div>
              ) : (
                getCustomerHistory(selectedCustomer.id).map((item) => (
                  <div key={item.id} className="flex gap-4 relative">
                    
                    {/* Icon Column */}
                    <div className="z-10 flex items-center justify-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ring-4 ${
                        item.type === 'request' ? (item.status === 'pending' ? 'bg-amber-100 text-amber-700 ring-amber-50' : 'bg-slate-100 text-slate-600 ring-slate-50') :
                        item.type === 'collection' ? 'bg-emerald-100 text-emerald-700 ring-emerald-50' :
                        'bg-blue-100 text-blue-700 ring-blue-50'
                      }`}>
                        {item.type === 'request' ? <FileText className="w-3.5 h-3.5" /> :
                         item.type === 'collection' ? <ShoppingBag className="w-3.5 h-3.5" /> :
                         <DollarSign className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 bg-slate-50 hover:bg-slate-100/60 p-3.5 rounded-xl border border-slate-100 transition">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-xs text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs mt-1 font-medium">{item.detail}</p>
                      
                      {item.type === 'request' && item.status === 'pending' && (
                        <div className="mt-3">
                          <button
                            id={`fulfill-req-btn-${item.id}`}
                            onClick={() => triggerFulfillModal(item.raw as Request)}
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md cursor-pointer transition"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Supply and Mark Fulfilled</span>
                          </button>
                        </div>
                      )}

                      {item.amount !== null && (
                        <div className="mt-2 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100/60">
                          <span className="text-xs font-black text-slate-800">
                            Total Amount: {formatNaira(item.amount)}
                          </span>
                          <button
                            id={`generate-receipt-btn-${item.id}`}
                            onClick={() => {
                              setSelectedReceiptTx({
                                id: item.id,
                                type: item.type as 'collection' | 'payment',
                                date: item.date,
                                amount: item.amount || 0,
                                notes: (item.raw as any).notes,
                                commodityId: item.type === 'collection' ? (item.raw as Collection).commodityId : undefined,
                                quantity: item.type === 'collection' ? (item.raw as Collection).quantity : undefined,
                                unit: item.type === 'collection' ? (item.raw as Collection).unit : undefined,
                                unitPrice: item.type === 'collection' ? (item.raw as Collection).unitPrice : undefined,
                              });
                            }}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-[#FAF6F0] text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs border border-none"
                          >
                            <FileText className="w-3 h-3 text-amber-500" />
                            <span>Receipt / Invoice</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        /* -------------------- CUSTOMERS DIRECTORY -------------------- */
        <div id="customers-directory-view" className="space-y-4">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="customer-search-input"
                type="text"
                placeholder="Search customers by name, work..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                id="import-csv-trigger-btn"
                onClick={() => {
                  setImportText('');
                  setImportPreview([]);
                  setImportError(null);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Batch Import CSV</span>
                <span className="sm:hidden">Import</span>
              </button>

              <button
                id="add-customer-trigger-btn"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Customers Cards / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl py-12 text-center border border-slate-100 shadow-sm">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h3 className="text-slate-700 font-bold text-sm">No customers found</h3>
                <p className="text-slate-400 text-xs mt-1">Try adjusting your search criteria or add a new customer above.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const bal = getCustomerBalance(cust.id);
                return (
                  <div
                    key={cust.id}
                    id={`customer-card-${cust.id}`}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className="bg-white hover:bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition-all hover:translate-y-[-2px] duration-150 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate flex-1">{cust.name}</h3>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                      
                      <div className="space-y-1 text-slate-500 font-medium text-[11px]">
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </p>
                        {cust.workplace && (
                          <p className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{cust.workplace}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Credit Balance:</span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg tabular-nums ${bal > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {formatNaira(bal)}
                        </span>
                        {bal > 0 && (
                          <button
                            id={`wa-share-bal-${cust.id}`}
                            onClick={() => {
                              const cleanPhone = cust.phone.replace(/[^0-9+]/g, '');
                              let formattedPhone = cleanPhone;
                              if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
                                formattedPhone = `234${cleanPhone.slice(1)}`;
                              }
                              const text = encodeURIComponent(`Hello ${cust.name}, here is your current Vina outstanding balance: ${formatNaira(bal)}. Kindly verify and make payments towards your account. Thank you!`);
                              window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Share Outstanding Balance via WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.115.953 11.5.951c-5.44 0-9.865 4.371-9.869 9.8-.001 2.02.535 3.997 1.553 5.761l-1.018 3.72 3.841-.996zM17.15 14.54c-.282-.141-1.67-.82-1.929-.914-.26-.094-.449-.141-.639.141-.19.282-.734.914-.9 1.103-.165.19-.33.213-.611.072-1.393-.696-2.298-1.127-3.21-2.695-.24-.411.24-.382.687-1.275.076-.142.038-.266-.019-.382-.056-.113-.449-1.082-.615-1.482-.162-.392-.326-.34-.449-.346-.116-.006-.248-.007-.38-.007s-.347.049-.529.247c-.182.198-.694.678-.694 1.654s.71 1.916.81 2.048c.099.133 1.398 2.132 3.387 2.99.473.204.842.326 1.129.418.475.152.907.13 1.25.079.382-.057 1.67-.682 1.905-1.34.234-.658.234-1.221.164-1.34-.07-.119-.26-.19-.541-.331z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* -------------------- MODALS & OVERLAYS -------------------- */}

      {/* 1. Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Add New Customer</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alhaji Musa Ibrahim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08034567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Place of Work / Office (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Finance"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Pref / Notes (Optional)</label>
                <textarea
                  placeholder="e.g. Prefers white garri, pays at end of month."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-center cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-center cursor-pointer font-bold transition shadow"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Edit Customer</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Place of Work</label>
                <input
                  type="text"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-center cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-center cursor-pointer font-bold transition shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log Quick Request */}
      {showQuickRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Add Request Demand</h2>
              <button onClick={() => setShowQuickRequest(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Commodity</label>
                <select
                  value={reqCommodity}
                  onChange={(e) => setReqCommodity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                >
                  {commodities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Demand Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery next Thursday"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowQuickRequest(false)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow">Save Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log Quick Supply Collection */}
      {showQuickCollection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Supply Commodity Stock</h2>
              <button onClick={() => setShowQuickCollection(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Commodity Supplied</label>
                <select
                  value={colCommodity}
                  onChange={(e) => {
                    const selected = commodities.find(c => c.id === e.target.value);
                    setColCommodity(e.target.value);
                    if (selected) {
                      setColUnit(selected.defaultUnit);
                      setColUnitPrice(selected.defaultPrice);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                >
                  {commodities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={colQty}
                    onChange={(e) => setColQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    value={colUnit}
                    onChange={(e) => setColUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Unit Price (₦)</label>
                <input
                  type="number"
                  required
                  value={colUnitPrice}
                  onChange={(e) => setColUnitPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 px-3.5 py-2 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold">CALCULATED TOTAL CREDIT:</span>
                <span className="text-sm font-black text-slate-800">{formatNaira(colQty * colUnitPrice)}</span>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Supply Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delivered to Mrs. Chioma's car directly"
                  value={colNotes}
                  onChange={(e) => setColNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowQuickCollection(false)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow">Record Supply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Log Quick Payment Receipt */}
      {showQuickPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Log Repayment Payment</h2>
              <button onClick={() => setShowQuickPayment(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Amount Paid (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Repayment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Partial cash payment / Bank transfer reference"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowQuickPayment(false)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-bold shadow">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Fulfill Pending Request Modal */}
      {selectedRequestToFulfill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Fulfill Commodity Demand</h2>
              <button onClick={() => setSelectedRequestToFulfill(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <p className="text-slate-500 text-xs font-semibold">
              This will supply the commodity and mark the customer's pending demand request as <span className="text-emerald-600">fulfilled</span>.
            </p>

            <form onSubmit={submitFulfillment} className="space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity Supplied</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={colQty}
                    onChange={(e) => setColQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    value={colUnit}
                    onChange={(e) => setColUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Selling Price per Unit (₦)</label>
                <input
                  type="number"
                  required
                  value={colUnitPrice}
                  onChange={(e) => setColUnitPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 px-3.5 py-2 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold">CREDIT VALUE TO ACCRUE:</span>
                <span className="text-sm font-black text-slate-800">{formatNaira(colQty * colUnitPrice)}</span>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Supply Notes</label>
                <input
                  type="text"
                  required
                  value={colNotes}
                  onChange={(e) => setColNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setSelectedRequestToFulfill(null)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow">Fulfill and Supply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Batch Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-100 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Batch Import Customers</h2>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto text-xs font-semibold pr-1">
              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-[11px] text-amber-800">
                <p className="font-extrabold">Instructions:</p>
                <p className="mt-1">1. You can upload a <b>.csv</b> file OR paste lines directly from a spreadsheet like Excel.</p>
                <p>2. Column format should be: <b>Name, Phone, Workplace, Notes</b>.</p>
                <p>3. Do not include currency symbols or outstanding balances here. Outstanding debt can be logged by supplying stock.</p>
              </div>

              {/* File input */}
              <div className="space-y-1">
                <label className="block text-slate-500">Option A: Upload .CSV file</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1">
                <label className="block text-slate-500">Option B: Paste Comma-Separated Rows</label>
                <textarea
                  placeholder="Example:&#10;Alhaji Musa Ibrahim, 08012345678, Ministry of Agriculture, Prefers white bags&#10;Mrs. Ngozi Okonjo, 08187654321, State Secretariat, Sourced premium grade"
                  rows={4}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    const parsed = parseCSV(e.target.value);
                    setImportPreview(parsed);
                    if (parsed.length === 0 && e.target.value.trim().length > 0) {
                      setImportError("No rows parsed. Check separator format.");
                    } else {
                      setImportError(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {importError && (
                <div className="text-red-500 text-xs font-bold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  ⚠️ {importError}
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">Preview Customers ({importPreview.length} detected)</h3>
                  <div className="border border-slate-100 rounded-xl max-h-48 overflow-y-auto shadow-inner">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Workplace</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                        {importPreview.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-slate-800 font-extrabold">{p.name}</td>
                            <td className="py-2 px-3">{p.phone}</td>
                            <td className="py-2 px-3">{p.workplace}</td>
                            <td className="py-2 px-3 truncate max-w-[150px]">{p.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowImportModal(false)} 
                className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold cursor-pointer transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={importPreview.length === 0}
                onClick={() => {
                  onImportCustomers(importPreview);
                  setShowImportModal(false);
                  setImportText('');
                  setImportPreview([]);
                  alert(`Successfully imported ${importPreview.length} customers!`);
                }} 
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow"
              >
                Complete Import ({importPreview.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dynamic Receipt Canvas & Modal Overlay */}
      <ReceiptModal 
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        customer={selectedCustomer}
        transaction={selectedReceiptTx || undefined}
        commodities={commodities}
      />

      {/* Custom Delete Confirmation Modal */}
      {customerToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">Delete Customer Profile?</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to delete <strong>{customers.find(c => c.id === customerToDeleteId)?.name}</strong>? This will clear their record reference and ledger associations.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(customerToDeleteId);
                  setCustomerToDeleteId(null);
                  setSelectedCustomerId(null); // Return to directory view
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
