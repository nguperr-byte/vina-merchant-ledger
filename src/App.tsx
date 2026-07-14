import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  ShoppingBag, 
  Notebook, 
  PieChart, 
  Lock, 
  Unlock, 
  LogOut,
  Calendar,
  Layers,
  Shield,
  Palette,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Camera
} from 'lucide-react';
import { Customer, Request, Collection, Payment, Expenditure, Note, Commodity, AppState, UserAccount } from './types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_COMMODITIES, 
  INITIAL_REQUESTS, 
  INITIAL_COLLECTIONS, 
  INITIAL_PAYMENTS, 
  INITIAL_EXPENDITURES, 
  INITIAL_NOTES 
} from './data';

import PinLock from './components/PinLock';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Transactions from './components/Transactions';
import Commodities from './components/Commodities';
import Notepad from './components/Notepad';
import Reports from './components/Reports';
import Login from './components/Login';

// Firebase Imports
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { fetchUserDocs, saveUserDoc, deleteUserDoc, handleFirestoreError, OperationType, clearAllUserData } from './lib/db';

const THEMES = [
  { label: 'Cloud Grey', value: '#F4F5F7' },
  { label: 'Nordic Slate', value: '#1E222B' },
  { label: 'Warm Stone', value: '#F3EFE9' },
  { label: 'Mint Cream', value: '#EDF5F1' },
  { label: 'Pure White', value: '#FFFFFF' },
  { label: 'Obsidian Black', value: '#07080A' },
  { label: 'Pure Pitch Black', value: '#000000' }
];

const isDarkColor = (hex: string) => {
  const color = hex.replace('#', '');
  if (color.length !== 6) return false;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 150;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [defaultTxForm, setDefaultTxForm] = useState<'request' | 'collection' | 'payment' | 'expense' | 'note'>('request');
  
  // Theme Background state
  const [bgColor, setBgColor] = useState<string>(() => {
    return localStorage.getItem('vina_bg_color') || '#F4F5F7';
  });
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  
  // Cloud Auth & Fetch state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true); // Start loading immediately to check auth status
  const [showBypassButton, setShowBypassButton] = useState<boolean>(false);

  // Connection timeout helper
  useEffect(() => {
    if (isFetchingData) {
      const timer = setTimeout(() => {
        setShowBypassButton(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowBypassButton(false);
    }
  }, [isFetchingData]);

  // Background tab tracking & auto-logout after 10 minutes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('vina_background_timestamp', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const backgroundTimeStr = localStorage.getItem('vina_background_timestamp');
        if (backgroundTimeStr && currentUser) {
          const backgroundTime = parseInt(backgroundTimeStr, 10);
          const elapsed = Date.now() - backgroundTime;
          const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
          if (elapsed >= tenMinutes) {
            handleLogout();
            alert('Security Timeout: You have been logged out because the app was in the background for over 10 minutes.');
          }
        }
        localStorage.removeItem('vina_background_timestamp');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Dynamic Merchant ID and Copy helper mimicking banking mockup
  const merchantId = currentUser ? `00${Math.abs(currentUser.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000).toString().padStart(8, '0')}` : '0011223344';
  const [copied, setCopied] = useState(false);
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(merchantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Resize utilizing a canvas to max 128x128 for efficient base64 storage
        const canvas = document.createElement('canvas');
        const maxDim = 128;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          if (currentUser) {
            const updatedUser = { ...currentUser, avatarUrl: compressedBase64 };
            setCurrentUser(updatedUser);
            try {
              const userDocRef = doc(db, 'users', currentUser.id);
              await setDoc(userDocRef, updatedUser);
            } catch (err) {
              console.error('Failed to save avatar to Firestore', err);
            }
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // App state persistent in localStorage
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('vina_garri_pin'));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const hasPin = localStorage.getItem('vina_garri_pin');
    return !!hasPin; // Lock automatically if pin exists
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // States loaded from cloud
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Monitor Auth Changes and Fetch Cloud Ledger
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsFetchingData(true);
        try {
          // 1. Fetch user profile from Firestore or fallback to standard structure
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDocSnap;
          try {
            userDocSnap = await getDoc(userDocRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }

          let userProfile: UserAccount;
          if (userDocSnap.exists()) {
            userProfile = userDocSnap.data() as UserAccount;
          } else {
            userProfile = {
              id: firebaseUser.uid,
              username: firebaseUser.email || '',
              fullName: firebaseUser.displayName || 'Vina User',
              role: 'admin',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, userProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
            }
          }
          
          setCurrentUser(userProfile);
          if (userProfile.bgColor) {
            setBgColor(userProfile.bgColor);
            localStorage.setItem('vina_bg_color', userProfile.bgColor);
          }

          // 3. Load all user documents from Firestore
          const [
            dbCustomers,
            dbCommodities,
            dbRequests,
            dbCollections,
            dbPayments,
            dbExpenditures,
            dbNotes
          ] = await Promise.all([
            fetchUserDocs<Customer>('customers', firebaseUser.uid),
            fetchUserDocs<Commodity>('commodities', firebaseUser.uid),
            fetchUserDocs<Request>('requests', firebaseUser.uid),
            fetchUserDocs<Collection>('collections', firebaseUser.uid),
            fetchUserDocs<Payment>('payments', firebaseUser.uid),
            fetchUserDocs<Expenditure>('expenditures', firebaseUser.uid),
            fetchUserDocs<Note>('notes', firebaseUser.uid)
          ]);

          setCustomers(dbCustomers);
          setCommodities(dbCommodities);
          setRequests(dbRequests);
          setCollections(dbCollections);
          setPayments(dbPayments);
          setExpenditures(dbExpenditures);
          setNotes(dbNotes);

        } catch (error) {
          console.error("Error setting up session and loading user ledger from cloud:", error);
        } finally {
          setIsFetchingData(false);
        }
      } else {
        // Logged out
        setCurrentUser(null);
        setCustomers([]);
        setCommodities([]);
        setRequests([]);
        setCollections([]);
        setPayments([]);
        setExpenditures([]);
        setNotes([]);
        setIsFetchingData(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('vina_garri_current_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('vina_garri_current_user');
      setActiveTab('dashboard');
    } catch (e) {
      console.error("Error logging out from Firebase:", e);
    }
  };

  // Synchronize document.body with active background color
  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  // Click outside listener to automatically close the theme selector dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isThemeDropdownOpen && !target.closest('#bg-theme-selector-container')) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isThemeDropdownOpen]);

  const handleChangeBgColor = async (newColor: string) => {
    setBgColor(newColor);
    localStorage.setItem('vina_bg_color', newColor);
    if (currentUser) {
      const updatedProfile: UserAccount = { ...currentUser, bgColor: newColor };
      setCurrentUser(updatedProfile);
      try {
        await setDoc(doc(db, 'users', currentUser.id), { bgColor: newColor }, { merge: true });
      } catch (error) {
        console.error("Error saving background color to cloud Firestore:", error);
      }
    }
  };

  // PIN settings helpers
  const handleSetPin = (newPin: string) => {
    setPin(newPin);
    localStorage.setItem('vina_garri_pin', newPin);
  };

  const handleClearPin = () => {
    setPin(null);
    localStorage.removeItem('vina_garri_pin');
    setIsLocked(false);
  };

  // State manipulation triggers passed to subcomponents
  
  // 1. CUSTOMERS
  const handleAddCustomer = async (newCust: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const id = `c-${Date.now()}`;
    const cust: Customer = {
      ...newCust,
      id,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [cust, ...prev]);
    await saveUserDoc('customers', currentUser.id, id, cust);
  };

  const handleImportCustomers = async (newCusts: Omit<Customer, 'id' | 'createdAt'>[]) => {
    if (!currentUser) return;
    const timestamp = Date.now();
    const imported = newCusts.map((nc, index) => ({
      ...nc,
      id: `c-${timestamp}-${index}`,
      createdAt: new Date().toISOString()
    }));
    setCustomers(prev => [...imported, ...prev]);
    await Promise.all(imported.map(c => saveUserDoc('customers', currentUser.id, c.id, c)));
  };

  const handleEditCustomer = async (editedCust: Customer) => {
    if (!currentUser) return;
    setCustomers(prev => prev.map(c => c.id === editedCust.id ? editedCust : c));
    await saveUserDoc('customers', currentUser.id, editedCust.id, editedCust);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!currentUser) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    setRequests(prev => prev.filter(r => r.customerId !== id));
    setCollections(prev => prev.filter(c => c.customerId !== id));
    setPayments(prev => prev.filter(p => p.customerId !== id));
    
    // Delete in firestore
    await deleteUserDoc('customers', id);
    const affectedRequests = requests.filter(r => r.customerId === id);
    const affectedCollections = collections.filter(c => c.customerId === id);
    const affectedPayments = payments.filter(p => p.customerId === id);
    await Promise.all([
      ...affectedRequests.map(r => deleteUserDoc('requests', r.id)),
      ...affectedCollections.map(c => deleteUserDoc('collections', c.id)),
      ...affectedPayments.map(p => deleteUserDoc('payments', p.id))
    ]);
  };

  const handleRestoreDatabase = async (backupData: any) => {
    if (!currentUser) return;
    const batch = writeBatch(db);
    
    if (backupData.customers) {
      setCustomers(backupData.customers);
      backupData.customers.forEach((c: any) => batch.set(doc(db, "customers", c.id), { ...c, userId: currentUser.id }));
    }
    if (backupData.commodities) {
      setCommodities(backupData.commodities);
      backupData.commodities.forEach((c: any) => batch.set(doc(db, "commodities", c.id), { ...c, userId: currentUser.id }));
    }
    if (backupData.requests) {
      setRequests(backupData.requests);
      backupData.requests.forEach((r: any) => batch.set(doc(db, "requests", r.id), { ...r, userId: currentUser.id }));
    }
    if (backupData.collections) {
      setCollections(backupData.collections);
      backupData.collections.forEach((c: any) => batch.set(doc(db, "collections", c.id), { ...c, userId: currentUser.id }));
    }
    if (backupData.payments) {
      setPayments(backupData.payments);
      backupData.payments.forEach((p: any) => batch.set(doc(db, "payments", p.id), { ...p, userId: currentUser.id }));
    }
    if (backupData.expenditures) {
      setExpenditures(backupData.expenditures);
      backupData.expenditures.forEach((e: any) => batch.set(doc(db, "expenditures", e.id), { ...e, userId: currentUser.id }));
    }
    if (backupData.notes) {
      setNotes(backupData.notes);
      backupData.notes.forEach((n: any) => batch.set(doc(db, "notes", n.id), { ...n, userId: currentUser.id }));
    }
    await batch.commit();
  };

  const handleClearAllData = async () => {
    if (!currentUser) return;
    try {
      setIsFetchingData(true);
      await clearAllUserData(currentUser.id);
      setCustomers([]);
      setCommodities([]);
      setRequests([]);
      setCollections([]);
      setPayments([]);
      setExpenditures([]);
      setNotes([]);
    } catch (error) {
      console.error("Error clearing database:", error);
    } finally {
      setIsFetchingData(false);
    }
  };

  // 2. REQUESTS
  const handleAddRequest = async (newReq: Omit<Request, 'id' | 'status'>) => {
    if (!currentUser) return;
    const id = `req-${Date.now()}`;
    const req: Request = {
      ...newReq,
      id,
      status: 'pending'
    };
    setRequests(prev => [req, ...prev]);
    await saveUserDoc('requests', currentUser.id, id, req);
  };

  const handleDeleteRequest = async (id: string) => {
    if (!currentUser) return;
    setRequests(prev => prev.filter(r => r.id !== id));
    await deleteUserDoc('requests', id);
  };

  // 3. COLLECTIONS (SUPPLIES)
  const handleAddCollection = async (newCol: Omit<Collection, 'id' | 'totalAmount'>) => {
    if (!currentUser) return;
    const id = `col-${Date.now()}`;
    const col: Collection = {
      ...newCol,
      id,
      totalAmount: newCol.quantity * newCol.unitPrice
    };
    setCollections(prev => [col, ...prev]);
    await saveUserDoc('collections', currentUser.id, id, col);
    return col;
  };

  const handleDeleteCollection = async (id: string) => {
    if (!currentUser) return;
    setCollections(prev => prev.filter(c => c.id !== id));
    await deleteUserDoc('collections', id);
  };

  // Fulfill a pending request directly (turns it into a collection and sets request status to fulfilled)
  const handleFulfillRequest = async (reqId: string, colData: Omit<Collection, 'id' | 'totalAmount'>) => {
    if (!currentUser) return;
    const col = await handleAddCollection(colData);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'fulfilled' } : r));
    const foundReq = requests.find(r => r.id === reqId);
    if (foundReq) {
      await saveUserDoc('requests', currentUser.id, reqId, { ...foundReq, status: 'fulfilled' });
    }
  };

  // 4. PAYMENTS
  const handleAddPayment = async (newPay: Omit<Payment, 'id'>) => {
    if (!currentUser) return;
    const id = `pay-${Date.now()}`;
    const pay: Payment = {
      ...newPay,
      id
    };
    setPayments(prev => [pay, ...prev]);
    await saveUserDoc('payments', currentUser.id, id, pay);
  };

  const handleDeletePayment = async (id: string) => {
    if (!currentUser) return;
    setPayments(prev => prev.filter(p => p.id !== id));
    await deleteUserDoc('payments', id);
  };

  // 5. EXPENDITURES
  const handleAddExpenditure = async (newExp: Omit<Expenditure, 'id'>) => {
    if (!currentUser) return;
    const id = `exp-${Date.now()}`;
    const exp: Expenditure = {
      ...newExp,
      id
    };
    setExpenditures(prev => [exp, ...prev]);
    await saveUserDoc('expenditures', currentUser.id, id, exp);
  };

  const handleDeleteExpenditure = async (id: string) => {
    if (!currentUser) return;
    setExpenditures(prev => prev.filter(e => e.id !== id));
    await deleteUserDoc('expenditures', id);
  };

  // 6. COMMODITIES
  const handleAddCommodity = (newCom: Omit<Commodity, 'id'>) => {
    if (!currentUser) return {} as Commodity;
    const id = `com-${Date.now()}`;
    const com: Commodity = {
      ...newCom,
      id
    };
    setCommodities(prev => [...prev, com]);
    saveUserDoc('commodities', currentUser.id, id, com);
    return com;
  };

  const handleEditCommodity = async (editedCom: Commodity) => {
    if (!currentUser) return;
    setCommodities(prev => prev.map(c => c.id === editedCom.id ? editedCom : c));
    await saveUserDoc('commodities', currentUser.id, editedCom.id, editedCom);
  };

  const handleDeleteCommodity = async (id: string) => {
    if (!currentUser) return;
    setCommodities(prev => prev.filter(c => c.id !== id));
    await deleteUserDoc('commodities', id);
  };

  // 7. NOTES
  const handleAddNote = async (newNote: Omit<Note, 'id' | 'date'>) => {
    if (!currentUser) return;
    const id = `n-${Date.now()}`;
    const note: Note = {
      ...newNote,
      id,
      date: new Date().toISOString()
    };
    setNotes(prev => [note, ...prev]);
    await saveUserDoc('notes', currentUser.id, id, note);
  };

  const handleEditNote = async (editedNote: Note) => {
    if (!currentUser) return;
    setNotes(prev => prev.map(n => n.id === editedNote.id ? editedNote : n));
    await saveUserDoc('notes', currentUser.id, editedNote.id, editedNote);
  };

  const handleDeleteNote = async (id: string) => {
    if (!currentUser) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    await deleteUserDoc('notes', id);
  };

  // Quick Action Navigator Helper
  const handleQuickAction = (action: 'request' | 'collection' | 'payment' | 'expense' | 'note') => {
    if (action === 'note') {
      setActiveTab('notepad');
    } else {
      setDefaultTxForm(action);
      setActiveTab('transactions');
    }
  };

  // 1. Loader Overlay when loading cloud data
  if (isFetchingData) {
    return (
      <div className="fixed inset-0 bg-[#F4F9F6] text-[#0A1E1B] flex flex-col justify-center items-center px-4 z-50 font-sans">
        <div className="flex flex-col items-center space-y-4 text-center">
          <img
            src="/logo.jpg"
            alt="Vina Logo"
            className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-[#00B875]/20 animate-pulse"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-[#0A1E1B] font-serif">Synchronizing Cloud Ledger</h2>
            <p className="text-xs text-[#62837E] font-medium max-w-[280px]">Downloading your secure customers, transactions, and notes...</p>
          </div>
          <div className="w-10 h-10 border-4 border-[#00B875]/20 border-t-[#00B875] rounded-full animate-spin mt-2" />
          
          {showBypassButton && (
            <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in max-w-[320px]">
              <p className="text-[11px] text-[#A27A5C] font-semibold">
                Connection taking longer than expected. You can continue offline or reset your session.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setIsFetchingData(false)}
                  className="px-4 py-2 bg-[#00B875] hover:bg-[#009E64] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Skip & Go Offline
                </button>
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth);
                      setCurrentUser(null);
                      localStorage.removeItem('vina_garri_current_user');
                      window.location.reload();
                    } catch (err) {
                      setIsFetchingData(false);
                    }
                  }}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Sign Out / Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Session Login check
  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
      />
    );
  }

  // 3. Local Device PIN lock check
  if (isLocked) {
    return (
      <PinLock 
        storedPin={pin} 
        onUnlock={() => setIsLocked(false)} 
        onSetPin={handleSetPin} 
      />
    );
  }

  const isDark = isDarkColor(bgColor);

  const themeStyles = isDark ? {
    '--card-bg': '#121318',
    '--card-border': '#1E2026',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#9CA3AF',
    '--text-muted': '#6B7280',
    '--input-bg': '#16171B',
    '--input-border': '#282A34',
    '--btn-secondary-bg': '#16171B',
    '--btn-secondary-border': '#282A34',
    '--btn-secondary-text': '#E5E7EB',
    '--body-bg': bgColor,
    backgroundColor: bgColor,
  } : {
    '--card-bg': '#FFFFFF',
    '--card-border': '#E2E8F0',
    '--text-primary': '#0F172A',
    '--text-secondary': '#475569',
    '--text-muted': '#94A3B8',
    '--input-bg': '#FFFFFF',
    '--input-border': '#CBD5E1',
    '--btn-secondary-bg': '#FFFFFF',
    '--btn-secondary-border': '#E2E8F0',
    '--btn-secondary-text': '#334155',
    '--body-bg': bgColor,
    backgroundColor: bgColor,
  };

  return (
    <div 
      id="vina-app-container" 
      className="min-h-screen flex flex-col text-[var(--text-primary)] font-sans antialiased pb-24 transition-colors duration-300"
      style={themeStyles as React.CSSProperties}
    >
      
      {/* -------------------- UNIFIED TOP HEADER -------------------- */}
      <header className="bg-[var(--card-bg)] border-b border-[var(--card-border)] py-3 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs sticky top-0 z-30 transition-colors duration-300">
        
        {/* Brand Identity with Avatar and Pill styled like Mockup */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => avatarInputRef.current?.click()}
            className="w-10 h-10 rounded-full relative overflow-hidden group border border-emerald-500/10 shadow-sm shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 bg-gradient-to-br from-[#10B981] to-[#059669]"
            title="Upload Profile Picture"
          >
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-extrabold text-sm text-white">
                {currentUser?.fullName?.[0]?.toUpperCase() || 'M'}
              </span>
            )}
            
            {/* Hover overlay with Camera Icon */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150">
              <Camera className="w-4 h-4 text-white" />
            </div>
            
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </button>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="font-extrabold text-xs md:text-sm tracking-tight text-[var(--text-primary)] leading-none truncate max-w-[120px] md:max-w-[200px]">
                {currentUser?.fullName || 'Awal & Sons Construction'}
              </h1>
              <span className="text-[9px] text-[#10B981] font-black tracking-wider uppercase block mt-1 leading-none">Merchant Ledger</span>
            </div>
            
            {/* Mockup styled Account Pill */}
            <div 
              onClick={handleCopyAccount}
              className="flex items-center gap-1 bg-[var(--btn-secondary-bg)] border border-[var(--card-border)] hover:border-[#10B981] py-1 px-2.5 rounded-full text-[10px] font-bold text-[var(--text-secondary)] font-mono cursor-pointer transition shadow-xs shrink-0 select-none"
              title="Click to copy Merchant ID"
            >
              <span className="tabular-nums tracking-normal text-gray-500 font-bold">{merchantId}</span>
              <span className="p-0.5 text-[#10B981] shrink-0">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* User Controls & PIN Management */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Secure Access PIN Controllers */}
          <div className="flex items-center gap-1.5">
            {pin ? (
              <div className="flex items-center gap-1 bg-[#10B981]/10 border border-[#10B981]/30 py-1 px-2 rounded-xl">
                <span className="hidden md:inline text-[9px] text-[#10B981] font-black uppercase tracking-wider px-1">Secured</span>
                <button
                  id="header-lock-app"
                  onClick={() => setIsLocked(true)}
                  className="p-1 hover:bg-[#10B981]/20 text-[#10B981] rounded-lg cursor-pointer transition"
                  title="Lock Ledger"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button
                  id="header-clear-pin"
                  onClick={handleClearPin}
                  className="p-1 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 rounded-lg cursor-pointer transition"
                  title="Remove Protection PIN"
                >
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-setup-pin"
                onClick={() => setIsLocked(true)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold rounded-xl cursor-pointer transition leading-none"
                title="Configure access PIN lock"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Set Access PIN</span>
              </button>
            )}
          </div>

          {/* Background Theme Selector */}
          <div className="relative flex items-center" id="bg-theme-selector-container">
            <button
              id="header-theme-button"
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[#10B981] bg-[var(--btn-secondary-bg)] hover:bg-[#10B981]/10 rounded-xl border border-[var(--card-border)] cursor-pointer transition shrink-0 flex items-center justify-center"
              title="Customize Background Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {isThemeDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-[var(--text-primary)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2 font-sans">App Background</h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => {
                        handleChangeBgColor(theme.value);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`flex flex-col items-center p-1.5 rounded-xl border transition cursor-pointer ${
                        bgColor === theme.value 
                          ? 'border-[#10B981] bg-[#10B981]/10 text-[var(--text-primary)]' 
                          : 'border-[var(--card-border)] bg-[var(--btn-secondary-bg)] hover:bg-[var(--card-border)] hover:border-gray-400 text-[var(--text-secondary)]'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-full shadow-inner mb-1 border border-black/10" 
                        style={{ backgroundColor: theme.value }}
                      />
                      <span className="text-[8px] font-black tracking-tight text-center leading-tight truncate w-full">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Calendar Date (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1.5 bg-[var(--btn-secondary-bg)] border border-[var(--card-border)] py-1.5 px-3 rounded-xl text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Log Out Button */}
          <button
            id="header-logout-button"
            onClick={handleLogout}
            className="p-2 text-[var(--text-secondary)] hover:text-rose-400 bg-[var(--btn-secondary-bg)] hover:bg-rose-950/20 rounded-xl border border-[var(--card-border)] cursor-pointer transition shrink-0"
            title="Log Out Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>
      </header>

      {/* -------------------- MAIN PAGE CONTAINER -------------------- */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Inner Tab View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              customers={customers}
              requests={requests}
              collections={collections}
              payments={payments}
              expenditures={expenditures}
              commodities={commodities}
              onQuickAction={handleQuickAction}
              onNavigate={(tab) => {
                // Prevent standard user accessing admin views via dashboard clicks
                if (currentUser?.role !== 'admin' && tab === 'reports') {
                  setActiveTab('dashboard');
                } else {
                  setActiveTab(tab);
                }
              }}
              onViewCustomer={(id) => {
                setActiveTab('customers');
              }}
            />
          )}

          {activeTab === 'customers' && (
            <Customers 
              customers={customers}
              requests={requests}
              collections={collections}
              payments={payments}
              commodities={commodities}
              onAddCustomer={handleAddCustomer}
              onImportCustomers={handleImportCustomers}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddRequest={handleAddRequest}
              onAddCollection={handleAddCollection}
              onAddPayment={handleAddPayment}
              onFulfillRequest={handleFulfillRequest}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions 
              customers={customers}
              commodities={commodities}
              requests={requests}
              collections={collections}
              payments={payments}
              expenditures={expenditures}
              onAddRequest={handleAddRequest}
              onAddCollection={handleAddCollection}
              onAddPayment={handleAddPayment}
              onAddExpenditure={handleAddExpenditure}
              onDeleteRequest={handleDeleteRequest}
              onDeleteCollection={handleDeleteCollection}
              onDeletePayment={handleDeletePayment}
              onDeleteExpenditure={handleDeleteExpenditure}
              defaultFormType={defaultTxForm}
              onAddCommodity={handleAddCommodity}
            />
          )}

          {activeTab === 'commodities' && (
            <Commodities 
              commodities={commodities}
              onAddCommodity={handleAddCommodity}
              onEditCommodity={handleEditCommodity}
              onDeleteCommodity={handleDeleteCommodity}
            />
          )}

          {activeTab === 'notepad' && (
            <Notepad 
              notes={notes}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'reports' && currentUser?.role === 'admin' && (
            <Reports 
              customers={customers}
              collections={collections}
              payments={payments}
              expenditures={expenditures}
              commodities={commodities}
              requests={requests}
              notes={notes}
              onRestoreDatabase={handleRestoreDatabase}
              onClearAllData={handleClearAllData}
            />
          )}
        </div>

      </main>

      {/* -------------------- UNIFIED HORIZONTAL BOTTOM NAVIGATION BAR -------------------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--card-border)] shadow-2xl backdrop-blur-md bg-opacity-95 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2 md:px-8 py-2 flex items-center justify-around md:justify-center md:gap-4 lg:gap-8 text-[var(--text-primary)]">
          
          {/* Dashboard Tab */}
          <button
            id="bottom-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
              activeTab === 'dashboard' 
                ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[9px] md:text-xs font-bold tracking-tight">
              <span className="hidden md:inline">Dashboard Overview</span>
              <span className="md:hidden">Dashboard</span>
            </span>
          </button>

          {/* Customers Tab */}
          <button
            id="bottom-nav-customers"
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
              activeTab === 'customers' 
                ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'customers' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[9px] md:text-xs font-bold tracking-tight">
              Customers
            </span>
          </button>

          {/* Sourcing & Sales Tab */}
          <button
            id="bottom-nav-transactions"
            onClick={() => {
              setDefaultTxForm('request');
              setActiveTab('transactions');
            }}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
              activeTab === 'transactions' 
                ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowLeftRight className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'transactions' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[9px] md:text-xs font-bold tracking-tight">
              <span className="hidden md:inline">Sourcing & Sales</span>
              <span className="md:hidden">Sourcing</span>
            </span>
          </button>

          {/* Commodity Catalog Tab */}
          <button
            id="bottom-nav-commodities"
            onClick={() => setActiveTab('commodities')}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
              activeTab === 'commodities' 
                ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'commodities' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[9px] md:text-xs font-bold tracking-tight">
              <span className="hidden md:inline">Commodity Catalog</span>
              <span className="md:hidden">Catalog</span>
            </span>
          </button>

          {/* Business Notepad Tab */}
          <button
            id="bottom-nav-notepad"
            onClick={() => setActiveTab('notepad')}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
              activeTab === 'notepad' 
                ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Notebook className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'notepad' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[9px] md:text-xs font-bold tracking-tight">
              <span className="hidden md:inline">Business Notepad</span>
              <span className="md:hidden">Notes</span>
            </span>
          </button>

          {/* Profit Audit & Exports Tab */}
          {currentUser?.role === 'admin' && (
            <button
              id="bottom-nav-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl transition cursor-pointer min-w-[55px] md:min-w-0 ${
                activeTab === 'reports' 
                  ? 'bg-[#10B981] text-white font-black shadow-lg shadow-[#10B981]/20' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <PieChart className={`w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 ${activeTab === 'reports' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
              <span className="text-[9px] md:text-xs font-bold tracking-tight">
                <span className="hidden md:inline">Profit Audit & Exports</span>
                <span className="md:hidden">Audit</span>
              </span>
            </button>
          )}

        </div>
      </div>

    </div>
  );
}
