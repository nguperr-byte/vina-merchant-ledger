import React, { useState } from 'react';
import { Lock, Delete, Shield, Key } from 'lucide-react';
import { motion } from 'motion/react';

interface PinLockProps {
  storedPin: string | null;
  onUnlock: () => void;
  onSetPin: (newPin: string) => void;
}

export default function PinLock({ storedPin, onUnlock, onSetPin }: PinLockProps) {
  const [pinInput, setPinInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSettingNew, setIsSettingNew] = useState<boolean>(!storedPin);
  const [newPinSetupStep, setNewPinSetupStep] = useState<number>(1);
  const [tempPin, setTempPin] = useState<string>('');

  const handleKeyPress = (num: string) => {
    setError(null);
    if (pinInput.length < 4) {
      const nextInput = pinInput + num;
      setPinInput(nextInput);

      // Trigger action automatically when 4 digits are entered
      if (nextInput.length === 4) {
        setTimeout(() => {
          handlePinComplete(nextInput);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handlePinComplete = (enteredPin: string) => {
    if (isSettingNew) {
      if (newPinSetupStep === 1) {
        setTempPin(enteredPin);
        setNewPinSetupStep(2);
        setPinInput('');
      } else {
        if (enteredPin === tempPin) {
          onSetPin(enteredPin);
          onUnlock();
        } else {
          setError('PINs do not match. Try again.');
          setPinInput('');
          setNewPinSetupStep(1);
          setTempPin('');
        }
      }
    } else {
      if (enteredPin === storedPin || enteredPin === '1234') {
        onUnlock();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPinInput('');
      }
    }
  };

  return (
    <div id="pin-lock-container" className="fixed inset-0 bg-[#F4F9F6] text-[#0A1E1B] flex flex-col justify-between items-center px-6 py-12 z-50 overflow-hidden font-sans">
      
      {/* Top Section */}
      <div className="flex flex-col items-center text-center mt-6">
        <div className="w-16 h-16 bg-[#00B875]/10 rounded-full flex items-center justify-center text-[#00B875] mb-4 border border-[#00B875]/20 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A1E1B] font-serif">Vina</h1>
        <p className="text-[#3C5A55] text-sm mt-1 max-w-xs font-medium">
          Credit & Commodity Ledger
        </p>
 
        {/* Lock Info */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-[#00B875] font-serif">
            {isSettingNew 
              ? (newPinSetupStep === 1 ? 'Set secure 4-Digit PIN' : 'Confirm your 4-Digit PIN')
              : 'Enter PIN to Access Ledger'
            }
          </h2>
          <p className="text-[#62837E] text-xs mt-1">
            {!isSettingNew && 'Demo PIN is 1234'}
          </p>
        </div>
      </div>

      {/* Input Indicators */}
      <div className="my-6 flex flex-col items-center">
        <div className="flex gap-4 justify-center py-2">
          {[0, 1, 2, 3].map((index) => {
            const isActive = pinInput.length > index;
            return (
              <motion.div
                key={index}
                animate={{
                  scale: isActive ? [1, 1.2, 1] : 1,
                  backgroundColor: isActive ? '#00B875' : '#D5ECE2',
                }}
                transition={{ duration: 0.15 }}
                className="w-4 h-4 rounded-full border border-transparent shadow-inner"
              />
            );
          })}
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-[#EF4444] text-xs font-semibold mt-3"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Grid Keypad */}
      <div className="w-full max-w-xs flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-3 gap-3 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              id={`pin-btn-${num}`}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-white hover:bg-[#F4F9F6] active:bg-[#EBF7F2] border border-[#C4DCD3] flex items-center justify-center text-[#0A1E1B] text-xl font-bold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00B875]/50"
            >
              {num}
            </button>
          ))}
          
          {/* Reset / Set Mode toggle or empty */}
          <button
            id="pin-btn-action"
            onClick={() => {
              if (storedPin) {
                setIsSettingNew(!isSettingNew);
                setPinInput('');
                setError(null);
                setNewPinSetupStep(1);
              }
            }}
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-[10px] text-[#3C5A55] hover:text-[#00B875] transition-all hover:bg-[#F4F9F6]/50"
          >
            {storedPin && (
              <>
                <Key className="w-4 h-4 mb-1" />
                <span>{isSettingNew ? 'Back' : 'Reset'}</span>
              </>
            )}
          </button>

          <button
            id="pin-btn-0"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white hover:bg-[#F4F9F6] active:bg-[#EBF7F2] border border-[#C4DCD3] flex items-center justify-center text-[#0A1E1B] text-xl font-bold transition-all shadow-xs focus:outline-none"
          >
            0
          </button>

          <button
            id="pin-btn-backspace"
            onClick={handleBackspace}
            disabled={pinInput.length === 0}
            className="w-16 h-16 rounded-full flex items-center justify-center text-[#3C5A55] hover:text-[#0A1E1B] hover:bg-[#F4F9F6]/50 transition-all disabled:opacity-20 disabled:pointer-events-none"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Demo Bypass */}
        <button
          id="pin-btn-demo-unlock"
          onClick={() => {
            if (!storedPin) {
              onSetPin('1234');
            }
            onUnlock();
          }}
          className="mt-4 text-center text-xs text-[#00B875] hover:text-white font-semibold uppercase tracking-wider py-2.5 bg-[#00B875]/10 rounded-xl hover:bg-[#00B875] border border-[#00B875]/20 cursor-pointer transition-all duration-150"
        >
          Skip / Unlock Demo Mode
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[#62837E] text-xs mt-2 font-medium">
        <Shield className="w-3.5 h-3.5 text-[#00B875]" />
        <span>Vina Ledger • Local Storage Protected</span>
      </div>
    </div>
  );
}
