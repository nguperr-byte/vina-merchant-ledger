export interface Customer {
  id: string;
  name: string;
  phone: string;
  workplace: string;
  notes: string;
  createdAt: string;
}

export interface Commodity {
  id: string;
  name: string;
  defaultUnit: string;
  defaultPrice: number;
}

export interface Request {
  id: string;
  customerId: string;
  commodityId: string;
  quantity: number;
  unit: string;
  date: string;
  status: 'pending' | 'fulfilled';
  notes?: string;
}

export interface Collection {
  id: string;
  customerId: string;
  commodityId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  date: string;
  requestId?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Expenditure {
  id: string;
  type: 'stock_cost' | 'transport' | 'loading' | 'misc';
  amount: number;
  date: string;
  notes?: string;
  commodityId?: string; // Optional link to commodity
}

export interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
  passwordHash?: string; // Stored as plain text for simple client-side local persistence, optional in cloud sync
  createdAt: string;
  securityQuestion?: string;
  securityAnswer?: string;
  bgColor?: string;
  avatarUrl?: string;
}

export interface AppState {
  pin: string | null;
  isLocked: boolean;
  customers: Customer[];
  commodities: Commodity[];
  requests: Request[];
  collections: Collection[];
  payments: Payment[];
  expenditures: Expenditure[];
  notes: Note[];
  users: UserAccount[];
  currentUser: UserAccount | null;
}
