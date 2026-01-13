'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase-config';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db, firestore } from '@/lib/firebase-config';
import { doc, setDoc, collection, query as firestoreQuery, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { initializeUserCredits } from '@/lib/creditUtils';

import CitySelectorDropdown from '@/components/common/CitySelectorDropdown';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userPhone: string) => void;
}

type Step = 'phone' | 'profile' | 'otp' | 'success';

export default function PhoneAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: PhoneAuthModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [role, setRole] = useState('User');

  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => setMessage(''), [step]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible' }
      );
    }
  }, [isOpen]);

  /* -------- STEP 1: CHECK USER -------- */
  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setMessage('');

    const phoneNumber = `+91${phone}`;

    try {
      // Check in Firestore Users collection first
      const usersRef = collection(firestore, 'Users');
      const q = firestoreQuery(usersRef, where('phoneNumber', '==', phoneNumber));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Existing user found in Firestore - directly log them in
        setIsExistingUser(true);
        const userData = snapshot.docs[0].data();
        
        setName(userData.name || '');
        setCity(userData.city || '');
        setRole(userData.role || 'User');

        // Save to localStorage including UID
        const userId = snapshot.docs[0].id;
        localStorage.setItem('uid', userId);
        localStorage.setItem('phone', phoneNumber);
        localStorage.setItem('city', userData.city || '');
        localStorage.setItem('name', userData.name || '');
        localStorage.setItem('role', userData.role || 'User');
        if(userData.role==='Vendor' && userData.vendorId){
          localStorage.setItem('vendorId', userData.vendorId);
        }

        // Show success and close
        setStep('success');
        setTimeout(() => {
          onSuccess?.(phone);
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        // Check in Realtime Database as fallback
        const rtdbRef = ref(db, 'users');
        const rtdbQuery = query(
          rtdbRef,
          orderByChild('phoneNumber'),
          equalTo(phoneNumber)
        );

        const rtdbSnapshot = await get(rtdbQuery);

        if (rtdbSnapshot.exists()) {
          // Found in RTDB but not in Firestore - migrate and log in
          setIsExistingUser(true);
          const data = rtdbSnapshot.val();
          const uid = Object.keys(data)[0];
          const userData = data[uid];

          setName(userData.name);
          setCity(userData.city);
          setRole(userData.role);

          // Migrate to Firestore if not exists
          await setDoc(doc(firestore, 'Users', uid), userData);

          // Save to localStorage including UID
          localStorage.setItem('uid', uid);
          localStorage.setItem('phone', phoneNumber);
          localStorage.setItem('city', userData.city || '');
          localStorage.setItem('name', userData.name || '');
          localStorage.setItem('role', userData.role || 'User');

          // Show success and close
          setStep('success');
          setTimeout(() => {
            onSuccess?.(phone);
            onClose();
            window.location.reload();
          }, 1000);
        } else {
          // New user - go to profile step
          setIsExistingUser(false);
          setStep('profile');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setMessage('Error checking user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* -------- SEND OTP (Only for new users) -------- */
  const sendOtp = async () => {
    const appVerifier = recaptchaVerifierRef.current!;
    const phoneNumber = `+91${phone}`;

    const confirmation = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );

    setConfirmationResult(confirmation);
    setStep('otp');
    setMessage('OTP sent successfully');
  };

  /* -------- STEP 2 (NEW USER) -------- */
  const handleContinueToOtp = async () => {
    if (!name || !city) {
      setMessage('Name and City are required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await sendOtp();
    } catch {
      setMessage('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* -------- STEP 3 -------- */
  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !confirmationResult) {
      setMessage('Invalid OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await confirmationResult.confirm(otp);

      if (!isExistingUser) {
        const userData = {
          uid: result.user.uid,
          name,
          city,
          phoneNumber: result.user.phoneNumber,
          role: 'User',
          credits: 5,
          createdAt: serverTimestamp(),
        };
        
        // Save to Firestore Users collection (with unlockedServices)
        await setDoc(doc(firestore, 'Users', result.user.uid), {
          ...userData,
          unlockedServices: [],
        });
      }

      localStorage.setItem('uid', result.user.uid);
      localStorage.setItem('phone', result.user.phoneNumber || '');
      localStorage.setItem('city', city);
      localStorage.setItem('name', name);
      localStorage.setItem('role', role);

      setStep('success');
      setTimeout(() => {
        onSuccess?.(phone);
        onClose();
        // Reload page after successful login to update UI
        window.location.reload();
      }, 1000);
    } catch {
      setMessage('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setName('');
    setCity('');
    setMessage('');
    setIsExistingUser(false);
    setConfirmationResult(null);
    onClose();
    // No need to reload - user data is now in localStorage
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div id="recaptcha-container" />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Start Planning Your Wedding
        </h2>

        {/* PHONE STEP */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div className="flex">
              <span className="flex items-center px-4 rounded-l-lg bg-gray-100 border">
                +91
              </span>
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="9876543210"
                className="w-full rounded-r-lg border px-4 py-3 focus:ring-2 focus:ring-pink-400 outline-none"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* PROFILE STEP */}
        {step === 'profile' && (
          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name *"
              className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-pink-400 outline-none"
            />

            {/* ✅ CITY DROPDOWN */}
            <CitySelectorDropdown
              selectedCity={city}
              onCityChange={setCity}
            />

            <button
              onClick={handleContinueToOtp}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-white font-semibold"
            >
              Continue to OTP
            </button>
          </div>
        )}

        {/* OTP STEP */}
        {step === 'otp' && (
          <div className="space-y-4">
            <input
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-lg border px-4 py-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-400 outline-none"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <p className="text-center text-xl font-semibold text-green-600">
            Welcome 🎉
          </p>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
}
