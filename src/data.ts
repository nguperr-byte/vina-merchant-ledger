import { Customer, Commodity, Request, Collection, Payment, Expenditure, Note } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    name: 'Alhaji Musa Ibrahim',
    phone: '08034567890',
    workplace: 'Ministry of Finance',
    notes: 'Prefers yellow garri, usually takes 2 bags at once.',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'c-2',
    name: 'Mrs. Chioma Adeleke',
    phone: '08123456789',
    workplace: 'Federal Secretariat',
    notes: 'Pays partially around the 28th and clears by the 5th.',
    createdAt: '2026-06-02T11:30:00Z',
  },
  {
    id: 'c-3',
    name: 'Mr. Babajide Benson',
    phone: '09087654321',
    workplace: 'State High Court',
    notes: 'Always requests white garri.',
    createdAt: '2026-06-05T09:15:00Z',
  },
  {
    id: 'c-4',
    name: 'Grace Ocholi',
    phone: '07011223344',
    workplace: 'General Hospital',
    notes: 'First time buyer recommendation from Chioma.',
    createdAt: '2026-06-10T14:20:00Z',
  },
];

export const INITIAL_COMMODITIES: Commodity[] = [
  {
    id: 'com-1',
    name: 'Yellow Garri (Premium)',
    defaultUnit: 'Bag (50kg)',
    defaultPrice: 38000,
  },
  {
    id: 'com-2',
    name: 'White Garri (Standard)',
    defaultUnit: 'Bag (50kg)',
    defaultPrice: 32000,
  },
  {
    id: 'com-3',
    name: 'Local Rice',
    defaultUnit: 'Bag (50kg)',
    defaultPrice: 55000,
  },
  {
    id: 'com-4',
    name: 'Brown Beans',
    defaultUnit: 'Paint Bucket',
    defaultPrice: 4500,
  },
];

export const INITIAL_REQUESTS: Request[] = [
  {
    id: 'req-1',
    customerId: 'c-1',
    commodityId: 'com-1',
    quantity: 2,
    unit: 'Bag (50kg)',
    date: '2026-06-25T08:00:00Z',
    status: 'fulfilled',
    notes: 'Delivered directly to office.',
  },
  {
    id: 'req-2',
    customerId: 'c-2',
    commodityId: 'com-2',
    quantity: 1,
    unit: 'Bag (50kg)',
    date: '2026-06-26T10:00:00Z',
    status: 'fulfilled',
    notes: 'To be collected by her driver.',
  },
  {
    id: 'req-3',
    customerId: 'c-3',
    commodityId: 'com-1',
    quantity: 1,
    unit: 'Bag (50kg)',
    date: '2026-07-01T09:00:00Z',
    status: 'pending',
    notes: 'Requested urgent delivery before weekend.',
  },
  {
    id: 'req-4',
    customerId: 'c-4',
    commodityId: 'com-4',
    quantity: 4,
    unit: 'Paint Bucket',
    date: '2026-07-02T13:45:00Z',
    status: 'pending',
    notes: 'Wants to collect along with next yellow garri batch.',
  },
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    customerId: 'c-1',
    commodityId: 'com-1',
    quantity: 2,
    unit: 'Bag (50kg)',
    unitPrice: 38000,
    totalAmount: 76000,
    date: '2026-06-25T11:00:00Z',
    requestId: 'req-1',
    notes: 'Delivered to Finance Ministry.',
  },
  {
    id: 'col-2',
    customerId: 'c-2',
    commodityId: 'com-2',
    quantity: 1,
    unit: 'Bag (50kg)',
    unitPrice: 32000,
    totalAmount: 32000,
    date: '2026-06-26T14:30:00Z',
    requestId: 'req-2',
    notes: 'Collected by driver.',
  },
  {
    id: 'col-3',
    customerId: 'c-3',
    commodityId: 'com-2',
    quantity: 1,
    unit: 'Bag (50kg)',
    unitPrice: 32000,
    totalAmount: 32000,
    date: '2026-06-15T12:00:00Z',
    notes: 'Direct pick up without request record.',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    customerId: 'c-1',
    amount: 50000,
    date: '2026-06-29T16:00:00Z',
    notes: 'Part payment via bank transfer.',
  },
  {
    id: 'pay-2',
    customerId: 'c-2',
    amount: 32000,
    date: '2026-06-30T10:00:00Z',
    notes: 'Full payment for June collection.',
  },
];

export const INITIAL_EXPENDITURES: Expenditure[] = [
  {
    id: 'exp-1',
    type: 'stock_cost',
    amount: 150000,
    date: '2026-06-10T08:00:00Z',
    notes: 'Bought 5 bags yellow and 5 bags white garri from Dawanau Market.',
  },
  {
    id: 'exp-2',
    type: 'transport',
    amount: 15000,
    date: '2026-06-10T09:30:00Z',
    notes: 'Delivery van from market to storage.',
  },
  {
    id: 'exp-3',
    type: 'loading',
    amount: 4000,
    date: '2026-06-10T10:00:00Z',
    notes: 'Loading/offloading boys at depot.',
  },
  {
    id: 'exp-4',
    type: 'misc',
    amount: 2500,
    date: '2026-06-15T11:00:00Z',
    notes: 'Packaging bags replacement.',
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    title: 'Yellow Garri Supply Check',
    text: 'Supplier mentioned price might increase by ₦1,500 next month due to transportation. Plan to buy more stock early.',
    date: '2026-06-28T14:00:00Z',
  },
  {
    id: 'n-2',
    title: 'Customer follow-ups',
    text: 'Call Alhaji Musa on the 29th to confirm office delivery for next week. He mentioned they will get paid early.',
    date: '2026-06-20T09:00:00Z',
  },
];
