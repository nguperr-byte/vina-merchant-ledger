import React, { useState } from 'react';
import { 
  FileText, 
  Share2, 
  Download, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Award,
  AlertCircle,
  Copy,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Customer, Request, Collection, Payment, Expenditure, Commodity } from '../types';

interface ReportsProps {
  customers: Customer[];
  collections: Collection[];
  payments: Payment[];
  expenditures: Expenditure[];
  commodities: Commodity[];
  requests: Request[];
  notes: any[];
  onRestoreDatabase: (backupData: any) => void;
  onClearAllData: () => Promise<void>;
}

export default function Reports({
  customers,
  collections,
  payments,
  expenditures,
  commodities,
  requests,
  notes,
  onRestoreDatabase,
  onClearAllData,
}: ReportsProps) {
  
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // 1. "Who Owes Me" - Customers with positive outstanding balances
  const getDebtorsList = () => {
    return customers.map(cust => {
      const colls = collections.filter(c => c.customerId === cust.id).reduce((sum, item) => sum + item.totalAmount, 0);
      const pays = payments.filter(p => p.customerId === cust.id).reduce((sum, item) => sum + item.amount, 0);
      const balance = colls - pays;
      return {
        ...cust,
        balance
      };
    })
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  };

  const debtors = getDebtorsList();
  const grandTotalDebt = debtors.reduce((sum, d) => sum + d.balance, 0);

  // Send WhatsApp/SMS text reminder for a single debtor
  const shareSingleReminder = (custName: string, balance: number) => {
    const text = `Hello ${custName}, this is a gentle reminder from Vina. Your current outstanding balance for supplies received is ${formatNaira(balance)}. Kindly verify and make payments towards your account. Thank you!`;
    if (navigator.share) {
      navigator.share({
        title: 'Vina Debt Reminder',
        text: text
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(text);
      showToast(`Reminder text copied for ${custName}!`);
    }
  };

  // Copy entire debt list formatted beautifully
  const copyCompleteDebtListText = () => {
    let text = `*VINA - CREDIT RECOVERY LEDGER*\n`;
    text += `Date generated: ${new Date().toLocaleDateString()}\n`;
    text += `===================================\n\n`;
    debtors.forEach((d, i) => {
      text += `${i + 1}. *${d.name}* (${d.phone})\n`;
      text += `   Workplace: ${d.workplace || 'N/A'}\n`;
      text += `   Owes: ${formatNaira(d.balance)}\n\n`;
    });
    text += `===================================\n`;
    text += `*GRAND TOTAL OUTSTANDING: ${formatNaira(grandTotalDebt)}*`;

    navigator.clipboard.writeText(text);
    showToast('Complete "Who Owes Me" list copied to clipboard!');
  };

  // 2. Sourcing vs Profit Breakdown
  const filterByMonth = (dateString: string, targetMonth: string) => {
    return dateString.startsWith(targetMonth);
  };

  const monthlyCollections = collections.filter(item => filterByMonth(item.date, selectedMonth));
  const monthlyCollectionsSum = monthlyCollections.reduce((sum, item) => sum + item.totalAmount, 0);

  const monthlyExpenditures = expenditures.filter(item => filterByMonth(item.date, selectedMonth));
  const monthlyExpendituresSum = monthlyExpenditures.reduce((sum, item) => sum + item.amount, 0);

  const monthlyNetProfit = monthlyCollectionsSum - monthlyExpendituresSum;

  // Breakdown of expenditures by category
  const getExpenditureBreakdown = () => {
    const categories = {
      stock_cost: 0,
      transport: 0,
      loading: 0,
      misc: 0
    };
    monthlyExpenditures.forEach(exp => {
      categories[exp.type] = (categories[exp.type] || 0) + exp.amount;
    });
    return categories;
  };

  const expBreakdown = getExpenditureBreakdown();

  // 3. EXPORTS: Real client-side CSV files generator & downloader
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${filename} download started successfully!`);
  };

  const handleExportCustomersCSV = () => {
    let csv = 'ID,Name,Phone,Workplace,Outstanding Balance,Date Created\r\n';
    customers.forEach(c => {
      const colls = collections.filter(col => col.customerId === c.id).reduce((sum, item) => sum + item.totalAmount, 0);
      const pays = payments.filter(p => p.customerId === c.id).reduce((sum, item) => sum + item.amount, 0);
      const bal = colls - pays;
      csv += `"${c.id}","${c.name}","${c.phone}","${c.workplace || ''}",${bal},"${new Date(c.createdAt).toLocaleDateString()}"\r\n`;
    });
    downloadCSV(csv, 'vina_garri_customer_ledger.csv');
  };

  const handleExportTransactionsCSV = () => {
    let csv = 'Transaction ID,Date,Type,Customer,Commodity,Quantity,Unit,Unit Price,Total Owed/Paid/Spent,Notes\r\n';
    
    // Add Collections
    collections.forEach(col => {
      const custName = customers.find(c => c.id === col.customerId)?.name || 'Unknown';
      const comName = commodities.find(c => c.id === col.commodityId)?.name || 'Unknown';
      csv += `"${col.id}","${new Date(col.date).toLocaleDateString()}","Supply","${custName}","${comName}",${col.quantity},"${col.unit}",${col.unitPrice},${col.totalAmount},"${col.notes || ''}"\r\n`;
    });

    // Add Payments
    payments.forEach(pay => {
      const custName = customers.find(c => c.id === pay.customerId)?.name || 'Unknown';
      csv += `"${pay.id}","${new Date(pay.date).toLocaleDateString()}","Repayment","${custName}","N/A",1,"N/A",${pay.amount},${pay.amount},"${pay.notes || ''}"\r\n`;
    });

    // Add Expenses
    expenditures.forEach(exp => {
      const comName = commodities.find(c => c.id === exp.commodityId)?.name || 'General';
      csv += `"${exp.id}","${new Date(exp.date).toLocaleDateString()}","Expense: ${exp.type.toUpperCase()}","N/A","${comName}",1,"N/A",${exp.amount},${exp.amount},"${exp.notes || ''}"\r\n`;
    });

    downloadCSV(csv, 'vina_garri_all_transactions.csv');
  };

  return (
    <div id="reports-view-container" className="space-y-6">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg z-50">
          <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Business Reports & Auditing</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track month-end profit and credit balances.</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
          <Calendar className="w-4 h-4 text-amber-500" />
          <select
            id="reports-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-slate-800 outline-none border-none cursor-pointer"
          >
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>
        </div>
      </div>

      {/* Grid: Who Owes Me vs Monthly P&L Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* "Who Owes Me" Outstanding balances card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">"Who Owes Me" List</h2>
                <p className="text-slate-400 text-[10px]">Salary earners with pending unpaid collections.</p>
              </div>

              {debtors.length > 0 && (
                <button
                  id="copy-debt-list-btn"
                  onClick={copyCompleteDebtListText}
                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-amber-100 cursor-pointer transition shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Complete List</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {debtors.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-slate-700 font-bold">Excellent: All accounts cleared!</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">No salary earners are currently on outstanding credit balances.</p>
                </div>
              ) : (
                debtors.map(debtor => (
                  <div
                    key={debtor.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100/60 rounded-xl hover:bg-slate-100/40 transition"
                  >
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-xs truncate">{debtor.name}</h4>
                      <p className="text-slate-400 text-[10px] truncate mt-0.5 font-medium">
                        {debtor.phone} • {debtor.workplace || 'No workplace noted'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-xs text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                        {formatNaira(debtor.balance)}
                      </span>

                      <button
                        id={`share-reminder-btn-${debtor.id}`}
                        onClick={() => shareSingleReminder(debtor.name, debtor.balance)}
                        className="p-1.5 bg-white hover:bg-amber-500 hover:text-white border border-slate-100 rounded-lg text-slate-500 cursor-pointer transition shadow-xs"
                        title="Copy Reminder message"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Total Outstanding Credit Ledger:</span>
            <span className="text-slate-900 text-sm">{formatNaira(grandTotalDebt)}</span>
          </div>
        </div>

        {/* Sourcing & Month Profit Audit Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-5 space-y-5">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Monthly Profit Audit</h2>
            <p className="text-slate-400 text-[10px]">Summary logs of the selected month ledger.</p>
          </div>

          {/* Simple breakdown list */}
          <div className="space-y-3 font-semibold text-xs">
            <div className="flex justify-between items-center p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
              <span className="text-emerald-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                Total Collections (Sales)
              </span>
              <span className="font-black text-emerald-900">{formatNaira(monthlyCollectionsSum)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-rose-50/40 border border-rose-100/50 rounded-xl">
              <span className="text-rose-800 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 shrink-0" />
                Total Sourcing/Logistics Costs
              </span>
              <span className="font-black text-rose-900">{formatNaira(monthlyExpendituresSum)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl shadow-inner">
              <span className="text-slate-300">Net Business Profit:</span>
              <span className={`text-sm font-black ${monthlyNetProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {formatNaira(monthlyNetProfit)}
              </span>
            </div>
          </div>

          {/* Expenditures Breakdown */}
          {monthlyExpenditures.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Expense Categories Breakdown:</span>
              <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                {expBreakdown.stock_cost > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Stock Sourcing Cost:</span>
                    <span>{formatNaira(expBreakdown.stock_cost)}</span>
                  </div>
                )}
                {expBreakdown.transport > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Logistics & Transport:</span>
                    <span>{formatNaira(expBreakdown.transport)}</span>
                  </div>
                )}
                {expBreakdown.loading > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Loading & Offloading:</span>
                    <span>{formatNaira(expBreakdown.loading)}</span>
                  </div>
                )}
                {expBreakdown.misc > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Miscellaneous Operations:</span>
                    <span>{formatNaira(expBreakdown.misc)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CSV Data Exporter Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-base font-black tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-500" />
              <span>Export Ledger Backup</span>
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-lg">
              Download your offline data tables straight to your browser or mobile phone as Excel-compatible CSV files. Keep your backups secure!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              id="export-customers-btn"
              onClick={handleExportCustomersCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Export Customers (CSV)</span>
            </button>

            <button
              id="export-transactions-btn"
              onClick={handleExportTransactionsCSV}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export All Ledger Logs (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* JSON System Backup & Restore Disaster Recovery */}
      <div className="bg-slate-950 text-[#FAF6F0] rounded-2xl p-6 border border-amber-500/10 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl transform -translate-x-12 -translate-y-12" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight flex items-center gap-2">
              <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">⚙️</span>
              <span>Local Database Backup & Restore</span>
            </h2>
            <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
              Highly recommended for Tecno Spark 4 and offline mobile users! Download a complete database backup of your customers, transactions, commodities, and notes. You can restore this file at any time to recover your records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {/* Backup Button */}
            <button
              id="system-backup-json-btn"
              onClick={() => {
                const backupPayload = {
                  version: '2.0',
                  timestamp: new Date().toISOString(),
                  customers,
                  collections,
                  payments,
                  expenditures,
                  commodities,
                  requests,
                  notes
                };
                const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vina_garri_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[#FAF6F0] font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📥</span>
              <span>Download System Backup (.json)</span>
            </button>

            {/* Restore File Trigger */}
            <label
              id="system-restore-label"
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center"
            >
              <span>📤</span>
              <span>Upload & Restore Backup</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (!data.customers && !data.collections) {
                        alert("Invalid backup file. Missing essential ledger tables.");
                        return;
                      }
                      if (confirm("WARNING: This will replace your current local ledger tables. Are you sure you want to proceed?")) {
                        onRestoreDatabase(data);
                        alert("Database restored successfully! All records have been recovered.");
                        window.location.reload();
                      }
                    } catch (err) {
                      alert("Failed to parse the backup file. Make sure it is a valid Vina backup JSON file.");
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reset Account to Clean State */}
      <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-base font-black text-rose-900 tracking-tight flex items-center gap-2">
              <span className="p-1 bg-rose-100 text-rose-700 rounded-lg">⚠️</span>
              <span>Reset Account & Start Clean</span>
            </h2>
            <p className="text-rose-700/80 text-xs max-w-lg leading-relaxed">
              Wipe out the pre-seeded activities, default customers, commodities, notepad logs, and transaction audits so you can begin using your Vina merchant platform completely clean.
            </p>
          </div>

          <button
            id="system-clear-database-btn"
            onClick={async () => {
              if (window.confirm("WARNING: This will permanently delete ALL outstanding credit, customers, commodities, notes, and audits. Are you absolutely sure you want to start clean?")) {
                try {
                  await onClearAllData();
                  showToast("Account reset successfully! Starting clean.");
                } catch (e) {
                  alert("Failed to reset account data: " + e);
                }
              }
            }}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <span>🗑️</span>
            <span>Wipe All Data & Start Clean</span>
          </button>
        </div>
      </div>

    </div>
  );
}
