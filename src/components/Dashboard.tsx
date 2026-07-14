import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  UserPlus, 
  FileText, 
  Plus, 
  ChevronRight,
  TrendingDown,
  Activity,
  Calendar
} from 'lucide-react';
import { Customer, Request, Collection, Payment, Expenditure, Commodity } from '../types';

interface DashboardProps {
  customers: Customer[];
  requests: Request[];
  collections: Collection[];
  payments: Payment[];
  expenditures: Expenditure[];
  commodities: Commodity[];
  onQuickAction: (action: 'request' | 'collection' | 'payment' | 'expense' | 'note') => void;
  onNavigate: (tab: string) => void;
  onViewCustomer: (id: string) => void;
}

export default function Dashboard({
  customers,
  requests,
  collections,
  payments,
  expenditures,
  commodities,
  onQuickAction,
  onNavigate,
  onViewCustomer,
}: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07'); // Default to latest in dummy data / current date

  // Helper: format money in Naira
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculations
  const totalOutstandingCredit = customers.reduce((sum, cust) => {
    const colls = collections.filter(c => c.customerId === cust.id).reduce((s, item) => s + item.totalAmount, 0);
    const pays = payments.filter(p => p.customerId === cust.id).reduce((s, item) => s + item.amount, 0);
    const balance = colls - pays;
    return balance > 0 ? sum + balance : sum;
  }, 0);

  const owingCustomersCount = customers.filter(cust => {
    const colls = collections.filter(c => c.customerId === cust.id).reduce((s, item) => s + item.totalAmount, 0);
    const pays = payments.filter(p => p.customerId === cust.id).reduce((s, item) => s + item.amount, 0);
    return (colls - pays) > 0;
  }).length;

  // Monthly stats helper
  const filterByMonth = (dateString: string, targetMonth: string) => {
    return dateString.startsWith(targetMonth);
  };

  const monthlyCollections = collections.filter(item => filterByMonth(item.date, selectedMonth));
  const monthlyCollectionsSum = monthlyCollections.reduce((sum, item) => sum + item.totalAmount, 0);

  const monthlyExpenditures = expenditures.filter(item => filterByMonth(item.date, selectedMonth));
  const monthlyExpendituresSum = monthlyExpenditures.reduce((sum, item) => sum + item.amount, 0);

  const monthlyNetProfit = monthlyCollectionsSum - monthlyExpendituresSum;

  const pendingRequestsCount = requests.filter(item => item.status === 'pending').length;

  // Monthly breakdown for SVG bar chart
  const availableMonths = [
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
  ];

  // Compile unified recent activity (last 5 actions)
  const unifiedActivity = [
    ...requests.map(item => ({
      id: item.id,
      type: 'request' as const,
      title: 'Commodity Requested',
      customer: customers.find(c => c.id === item.customerId)?.name || 'Unknown Customer',
      detail: `${item.quantity} ${item.unit} of ${commodities.find(c => c.id === item.commodityId)?.name || 'Garri'} (${item.status})`,
      date: item.date,
      color: item.status === 'pending' ? 'amber' : 'slate',
      amount: null
    })),
    ...collections.map(item => ({
      id: item.id,
      type: 'collection' as const,
      title: 'Stock Supplied',
      customer: customers.find(c => c.id === item.customerId)?.name || 'Unknown Customer',
      detail: `${item.quantity} ${item.unit} of ${commodities.find(c => c.id === item.commodityId)?.name || 'Garri'}`,
      date: item.date,
      color: 'emerald',
      amount: item.totalAmount
    })),
    ...payments.map(item => ({
      id: item.id,
      type: 'payment' as const,
      title: 'Payment Received',
      customer: customers.find(c => c.id === item.customerId)?.name || 'Unknown Customer',
      detail: item.notes || 'Credit repayment',
      date: item.date,
      color: 'blue',
      amount: item.amount
    })),
    ...expenditures.map(item => ({
      id: item.id,
      type: 'expenditure' as const,
      title: `Expense: ${item.type.replace('_', ' ').toUpperCase()}`,
      customer: 'Business Costs',
      detail: item.notes || 'Operating expense',
      date: item.date,
      color: 'rose',
      amount: item.amount
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* Upper Welcome Banner with modern aesthetic accent */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white font-serif">Vina Merchant Dashboard</h1>
            <p className="text-emerald-50/90 text-xs mt-1">
              Supplying quality to customers. Track requests, credit balances, and operational costs.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs font-semibold self-start md:self-auto">
            <Calendar className="w-4 h-4 text-emerald-100" />
            <select
              id="dashboard-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white outline-none border-none cursor-pointer font-medium text-xs"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value} className="bg-[#10B981] text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main KPI Grid - Redesigned to map perfectly to Mockup and be extremely clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Outstanding Credit / Total Ledger Balance (Spans 2 cols to match mockup style) */}
        <div 
          id="kpi-outstanding-credit" 
          className="bg-gradient-to-br from-[#EBFBF5] to-[#D1FAE5] dark:from-[#0B251A] dark:to-[#041B12] p-6 rounded-3xl shadow-sm text-[#065F46] dark:text-[#A7F3D0] border border-emerald-500/10 relative overflow-hidden flex flex-col justify-between h-40 sm:col-span-2 lg:col-span-2 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#10B981]/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[#065F46]/80 dark:text-emerald-300/80 text-xs font-bold tracking-wider uppercase">Outstanding Credit</span>
            <button 
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-1 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-emerald-500/20 py-1 px-3 rounded-full text-[10px] font-bold text-[#065F46] dark:text-[#A7F3D0] transition cursor-pointer"
            >
              <span>History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative z-10 mt-4">
            <span className="text-[10px] font-bold text-[#065F46]/70 dark:text-emerald-300/70 block mb-0.5">Total Ledger Balance</span>
            <h3 className="text-2xl md:text-3xl font-black text-[#044E34] dark:text-white tracking-tight font-mono tabular-nums leading-none">
              {formatNaira(totalOutstandingCredit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[#065F46]/80 dark:text-emerald-300/80 text-[10px] font-medium">
              <span className="bg-[#10B981]/10 px-2.5 py-0.5 rounded-md">Owed by {owingCustomersCount} {owingCustomersCount === 1 ? 'customer' : 'customers'}</span>
            </div>
          </div>
        </div>

        {/* Supplied (Sales) */}
        <div id="kpi-monthly-sales" className="bg-[var(--card-bg)] p-5 rounded-3xl shadow-xs border border-[var(--card-border)] flex flex-col justify-between h-40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-xs font-bold tracking-wider uppercase">Supplied (Sales)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono tabular-nums leading-none">
              {formatNaira(monthlyCollectionsSum)}
            </h3>
            <p className="text-[var(--text-muted)] text-[10px] font-bold mt-2">
              For {availableMonths.find(m => m.value === selectedMonth)?.label}
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div id="kpi-monthly-expenses" className="bg-[var(--card-bg)] p-5 rounded-3xl shadow-xs border border-[var(--card-border)] flex flex-col justify-between h-40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-xs font-bold tracking-wider uppercase">Expenses</span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono tabular-nums leading-none">
              {formatNaira(monthlyExpendituresSum)}
            </h3>
            <p className="text-[var(--text-muted)] text-[10px] font-bold mt-2">
              Sourcing & logistics cost
            </p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div id="kpi-estimated-profit" className="bg-[var(--card-bg)] p-5 rounded-3xl shadow-xs border border-[var(--card-border)] flex flex-col justify-between h-40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-xs font-bold tracking-wider uppercase">Profit Est.</span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${monthlyNetProfit >= 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl md:text-2xl font-black tracking-tight font-mono tabular-nums leading-none ${monthlyNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {formatNaira(monthlyNetProfit)}
            </h3>
            <p className="text-[var(--text-muted)] text-[10px] font-bold mt-2">
              Sourced profit Margin
            </p>
          </div>
        </div>

      </div>

      {/* Quick Action Panel - Styled exactly like mockup "Make Payment" layout */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-5 md:p-6 shadow-xs border border-[var(--card-border)] transition-colors duration-300">
        <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-1.5 font-sans">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <span>Make Payment / Log Actions</span>
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          <button 
            id="qa-btn-request"
            onClick={() => onQuickAction('request')}
            className="bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] hover:border-[#10B981] rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-150 text-center cursor-pointer shadow-xs group h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 dark:bg-[#10B981]/10 flex items-center justify-center text-[#10B981] relative border border-emerald-100/30">
              <Plus className="w-5 h-5 text-[#10B981] stroke-[2.5]" />
              <div className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] mt-1.5">New Request</span>
          </button>

          <button 
            id="qa-btn-collection"
            onClick={() => onQuickAction('collection')}
            className="bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] hover:border-[#10B981] rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-150 text-center cursor-pointer shadow-xs group h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 relative border border-emerald-100/30">
              <ShoppingBag className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              <div className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] mt-1.5">Supply Goods</span>
          </button>

          <button 
            id="qa-btn-payment"
            onClick={() => onQuickAction('payment')}
            className="bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] hover:border-[#10B981] rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-150 text-center cursor-pointer shadow-xs group h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 dark:bg-[#10B981]/10 flex items-center justify-center text-[#10B981] relative border border-emerald-100/30">
              <DollarSign className="w-5 h-5 text-[#10B981] stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] mt-1.5">Log Payment</span>
          </button>

          <button 
            id="qa-btn-expense"
            onClick={() => onQuickAction('expense')}
            className="bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] hover:border-[#10B981] rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-150 text-center cursor-pointer shadow-xs group h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50/50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 relative border border-rose-100/30">
              <TrendingDown className="w-5 h-5 text-rose-500 stroke-[2.5]" />
              <div className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] mt-1.5">Log Expense</span>
          </button>

          <button 
            id="qa-btn-note"
            onClick={() => onQuickAction('note')}
            className="bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] hover:border-[#10B981] rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-150 text-center cursor-pointer shadow-xs group h-28 col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 relative border border-indigo-100/30">
              <FileText className="w-5 h-5 text-indigo-500 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] mt-1.5">Add Note</span>
          </button>

        </div>
      </div>

      {/* Two Column Layout for Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Performance Visualization (Interactive SVG Chart) */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-5 shadow-xs border border-[var(--card-border)] lg:col-span-7 flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-sans">Business Trend</h2>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Sales
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Expenses
                </span>
              </div>
            </div>

            {/* Custom Premium SVG Chart with Adaptive styles */}
            <div className="h-44 w-full relative mt-2 flex items-end justify-around border-b border-[var(--card-border)] pb-2">
              {/* background grids */}
              <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-dashed border-gray-400 w-full" />
                <div className="border-t border-dashed border-gray-400 w-full" />
                <div className="border-t border-dashed border-gray-400 w-full" />
                <div className="border-t border-dashed border-gray-400 w-full" />
              </div>

              {/* Data bar columns */}
              {[
                { month: 'June', collections: collections.filter(item => filterByMonth(item.date, '2026-06')).reduce((sum, item) => sum + item.totalAmount, 0), expenses: expenditures.filter(item => filterByMonth(item.date, '2026-06')).reduce((sum, item) => sum + item.amount, 0) },
                { month: 'July', collections: collections.filter(item => filterByMonth(item.date, '2026-07')).reduce((sum, item) => sum + item.totalAmount, 0), expenses: expenditures.filter(item => filterByMonth(item.date, '2026-07')).reduce((sum, item) => sum + item.amount, 0) }
              ].map((data, index) => {
                const maxVal = Math.max(10000, ...[140000, data.collections, data.expenses]);
                const salesHeight = (data.collections / maxVal) * 100;
                const expenseHeight = (data.expenses / maxVal) * 100;

                return (
                  <div key={index} className="flex flex-col items-center gap-2 z-10 w-1/3">
                    <div className="flex gap-4 items-end justify-center w-full h-28">
                      {/* Sales Bar */}
                      <div className="relative group/bar flex flex-col items-center w-8">
                        <div className="absolute bottom-full mb-1 bg-slate-900 text-white border border-slate-800 text-[10px] py-1 px-1.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 shadow-md font-mono tabular-nums">
                          {formatNaira(data.collections)}
                        </div>
                        <div 
                          className="w-full bg-[#10B981] hover:bg-[#059669] rounded-t-lg transition-all duration-500 shadow-xs cursor-help"
                          style={{ height: `${Math.max(4, salesHeight)}px` }}
                        />
                      </div>
                      
                      {/* Expense Bar */}
                      <div className="relative group/bar flex flex-col items-center w-8">
                        <div className="absolute bottom-full mb-1 bg-slate-900 text-white border border-slate-800 text-[10px] py-1 px-1.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 shadow-md font-mono tabular-nums">
                          {formatNaira(data.expenses)}
                        </div>
                        <div 
                          className="w-full bg-rose-500 hover:bg-rose-600 rounded-t-lg transition-all duration-500 shadow-xs cursor-help"
                          style={{ height: `${Math.max(4, expenseHeight)}px` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-secondary)] mt-1">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center bg-[var(--btn-secondary-bg)] px-4 py-3 rounded-xl mt-4 border border-[var(--card-border)] text-xs transition-colors duration-300">
            <span className="text-[var(--text-secondary)]">Pending demand requests right now:</span>
            <button 
              onClick={() => onNavigate('customers')}
              className="font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
            >
              <span>{pendingRequestsCount} pending requests</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-5 shadow-xs border border-[var(--card-border)] lg:col-span-5 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-1.5 font-sans">
              <span>Recent Activity Ledger</span>
            </h2>
            
            <div className="space-y-3.5">
              {unifiedActivity.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs font-medium">
                  No activity logged yet. Use actions above to begin.
                </div>
              ) : (
                unifiedActivity.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs leading-relaxed group">
                    <div className="flex flex-col items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 border-2 border-[var(--card-bg)] ring-2 ${
                        act.color === 'amber' ? 'ring-amber-500 bg-amber-500' :
                        act.color === 'emerald' ? 'ring-emerald-500 bg-emerald-500' :
                        act.color === 'blue' ? 'ring-blue-500 bg-blue-500' :
                        act.color === 'rose' ? 'ring-rose-500 bg-rose-500' : 'ring-gray-500 bg-gray-500'
                      }`} />
                      <div className="w-0.5 bg-[var(--card-border)] grow mt-1 group-last:hidden" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-bold text-[var(--text-primary)]">{act.title}</h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase whitespace-nowrap">
                          {new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <p className="text-[var(--text-secondary)] font-medium text-[11px] truncate mt-0.5">{act.customer}</p>
                      <p className="text-[var(--text-muted)] text-[10px] italic truncate">{act.detail}</p>
                      
                      {act.amount !== null && (
                        <div className={`mt-1 font-mono font-black tabular-nums text-xs ${
                          act.type === 'expenditure' ? 'text-rose-500' : 'text-emerald-600'
                        }`}>
                          {act.type === 'expenditure' ? '-' : '+'} {formatNaira(act.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="mt-4 w-full bg-[var(--btn-secondary-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold py-2.5 rounded-xl transition cursor-pointer text-center block"
          >
            View Complete Reports
          </button>
        </div>

      </div>

    </div>
  );
}
