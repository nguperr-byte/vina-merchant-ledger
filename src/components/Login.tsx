import React, { useState } from 'react';
import { Shield, CreditCard } from 'lucide-react';
import { UserAccount } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/db';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }

      if (userDocSnap && userDocSnap.exists()) {
        onLogin(userDocSnap.data() as UserAccount);
      } else {
        // If profile doc doesn't exist yet, create one
        const profile: UserAccount = {
          id: user.uid,
          username: user.email || '',
          fullName: user.displayName || 'Vina User',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, profile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
        onLogin(profile);
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err.message || 'Error signing in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-container" className="fixed inset-0 bg-[#F4F9F6] text-[#0A1E1B] flex flex-col justify-center items-center px-4 py-8 z-50 overflow-y-auto font-sans">
      
      {/* Background abstract decoration in Vina colors */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00B875]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFA400]/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2ECE8] shadow-xl p-6 md:p-8 relative z-10 space-y-6">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="Vina Logo"
            className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-[#00B875]/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0A1E1B] font-serif">
              Vina Ledger
            </h1>
            <p className="text-[#62837E] text-xs mt-1 font-medium tracking-wide uppercase flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#00B875]" />
              Secure Cloud-Synced Terminal
            </p>
          </div>
        </div>

        {/* Google Sign-In Card */}
        <div className="bg-[#F0FAF7] border border-[#BDECE0] rounded-2xl p-6 text-center space-y-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#00B875] text-white uppercase tracking-wider">
              ⭐ Google Sign-In Enabled
            </span>
            <p className="text-sm text-[#0A1E1B] font-bold leading-normal">
              Sign in instantly to your account
            </p>
            <p className="text-xs text-[#4A6B66] leading-relaxed px-1">
              Your session is securely synced across all your devices using your Google profile.
            </p>
          </div>

          <button
            id="google-signin-top-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 bg-white hover:bg-[#F4F9F6] border border-[#00B875] hover:border-[#009E64] active:scale-[0.98] text-[#0A1E1B] font-bold text-sm rounded-2xl transition shadow-md shadow-[#00B875]/5 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#00B875] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.51 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.21 7.21 8.85 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.1 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 10.58c-.24-.73-.38-1.51-.38-2.33s.14-1.6.38-2.33L1.39 2.9C.5 4.68 0 6.68 0 8.75s.5 4.07 1.39 5.85l3.89-3.02z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 16.51c-3.15 0-5.79-2.17-6.72-5.54L1.39 14c1.98 3.89 5.96 6.56 10.61 6.56 2.98 0 5.48-.99 7.31-2.69l-3.66-2.84c-1.01.68-2.3 1.08-3.65 1.08z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="text-[#EF4444] text-xs font-semibold bg-red-50 p-3.5 rounded-2xl border border-red-100 flex items-start gap-2">
            <span className="text-sm shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[#62837E] text-xs mt-6 font-medium">
        <CreditCard className="w-3.5 h-3.5 text-[#00B875]" />
        <span>Authorized Access Only • Vina Merchant Platform</span>
      </div>
    </div>
  );
}
