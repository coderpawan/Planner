'use client';

import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/lib/firebase-config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  searchUserByPhoneNumber,
  promoteUserToAdmin,
  demoteAdminToUser,
  activateAdmin,
  deactivateAdmin,
  canPerformAction,
  SearchResult,
} from '@/lib/firestore-admin-management';
import AdminSearchCard from '@/components/admin/ManageAdmins/AdminSearchCard';
import ConfirmActionModal from '@/components/admin/ManageAdmins/ConfirmActionModal';
import { useRouter } from 'next/navigation';

export default function ManageAdminsPage() {
  const router = useRouter();
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAdminData, setCurrentAdminData] = useState<any>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Search state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [notFound, setNotFound] = useState(false);
  
  // Action state
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'promote' | 'demote' | 'activate' | 'deactivate' | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  
  // Client-side mounting check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (!isMounted) return;

    // Check if Firebase is initialized
    if (!auth || !firestore) {
      console.error('Firebase not initialized');
      setInitError('Firebase initialization failed. Please refresh the page.');
      setLoading(false);
      setIsAdminLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
        setUser(currentUser);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Auth state error:', error);
      setInitError('Authentication error. Please refresh the page.');
      setLoading(false);
      setIsAdminLoading(false);
    }
  }, [isMounted]);
  
  // Fetch current admin data
  useEffect(() => {
    if (!isMounted) return;

    const fetchCurrentAdmin = async () => {
      if (!user) {
        setIsAdminLoading(false);
        return;
      }

      if (!firestore) {
        console.error('Firestore not initialized');
        setInitError('Database connection failed. Please refresh the page.');
        setIsAdminLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentAdminData({ uid: user.uid, ...userData });
          console.log('Current admin data loaded:', { uid: user.uid, role: userData.role });
        } else {
          console.error('User document not found');
          setInitError('User data not found. Please contact support.');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setInitError('Failed to load user data. Please refresh the page.');
      } finally {
        setIsAdminLoading(false);
      }
    };
    
    fetchCurrentAdmin();
  }, [user, isMounted]);
  
  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setSearchError('Please enter a phone number');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    setNotFound(false);
    
    try {
      const result = await searchUserByPhoneNumber(phoneNumber);
      
      if (result) {
        setSearchResult(result);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle promote button click
  const handlePromoteClick = () => {
    if (!searchResult) return;
    
    const validation = canPerformAction(
      currentAdminData.uid,
      searchResult.user.uid,
      'PROMOTE'
    );
    
    if (!validation.allowed) {
      setToastMessage(validation.reason || 'Action not allowed');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    setPendingAction('promote');
    setShowConfirmModal(true);
  };
  
  // Handle demote button click
  const handleDemoteClick = () => {
    if (!searchResult) return;
    
    const validation = canPerformAction(
      currentAdminData.uid,
      searchResult.user.uid,
      'DEMOTE'
    );
    
    if (!validation.allowed) {
      setToastMessage(validation.reason || 'Action not allowed');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    setPendingAction('demote');
    setShowConfirmModal(true);
  };
    // Handle activate button click
  const handleActivateClick = () => {
    if (!searchResult) return;
    
    const validation = canPerformAction(
      currentAdminData.uid,
      searchResult.user.uid,
      'ACTIVATE'
    );
    
    if (!validation.allowed) {
      setToastMessage(validation.reason || 'Action not allowed');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    setPendingAction('activate');
    setShowConfirmModal(true);
  };
  
  // Handle deactivate button click
  const handleDeactivateClick = () => {
    if (!searchResult) return;
    
    const validation = canPerformAction(
      currentAdminData.uid,
      searchResult.user.uid,
      'DEACTIVATE'
    );
    
    if (!validation.allowed) {
      setToastMessage(validation.reason || 'Action not allowed');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    setPendingAction('deactivate');
    setShowConfirmModal(true);
  };
    // Handle confirmed action
  const handleConfirmAction = async () => {
    if (!searchResult || !pendingAction) return;
    
    setIsActionLoading(true);
    
    try {
      if (pendingAction === 'promote') {
        await promoteUserToAdmin(
          searchResult.user.uid,
          searchResult.user,
          currentAdminData.uid,
          currentAdminData.name
        );
        setToastMessage(`✓ ${searchResult.user.name} promoted to Admin`);
        
        // Update localStorage if the promoted user is the current user
        if (searchResult.user.uid === currentAdminData.uid) {
          localStorage.setItem('role', 'Admin');
        }
      } else if (pendingAction === 'demote') {
        await demoteAdminToUser(
          searchResult.user.uid,
          searchResult.user,
          currentAdminData.uid,
          currentAdminData.name
        );
        setToastMessage(`✓ ${searchResult.user.name} demoted to User`);
        
        // Update localStorage if the demoted user is the current user (shouldn't happen due to validation)
        if (searchResult.user.uid === currentAdminData.uid) {
          localStorage.setItem('role', 'User');
        }
      } else if (pendingAction === 'activate') {
        await activateAdmin(
          searchResult.user.uid,
          searchResult.user,
          currentAdminData.uid,
          currentAdminData.name
        );
        setToastMessage(`✓ ${searchResult.user.name} activated`);
      } else if (pendingAction === 'deactivate') {
        await deactivateAdmin(
          searchResult.user.uid,
          searchResult.user,
          currentAdminData.uid,
          currentAdminData.name
        );
        setToastMessage(`✓ ${searchResult.user.name} deactivated`);
      }
      
      // Refresh search result
      const updatedResult = await searchUserByPhoneNumber(phoneNumber);
      setSearchResult(updatedResult);
      
      // Close modal and show toast
      setShowConfirmModal(false);
      setPendingAction(null);
      setTimeout(() => setToastMessage(''), 5000);
    } catch (error) {
      console.error('Error performing action:', error);
      setToastMessage('❌ An error occurred. Please try again.');
      setTimeout(() => setToastMessage(''), 5000);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Don't render anything until mounted (prevents SSR issues)
  if (!isMounted) {
    return null;
  }

  // Loading state
  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Initialization Error
          </h2>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // Not authenticated
  if (!user || !currentAdminData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in as an admin to access this page.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Admins
          </h1>
          <p className="text-gray-600">
            Search for users by phone number to promote or demote admin access
          </p>
        </div>
        
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch}>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search by Phone Number
            </label>
            <div className="flex gap-3">
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g., +91 9876543210)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-sm text-red-600">{searchError}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: +91 9876543210, 9876543210, or any E.164 format
            </p>
          </form>
        </div>
        
        {/* Search Results */}
        {notFound && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <span className="text-4xl mb-2 block">🔍</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No User Found
            </h3>
            <p className="text-gray-600">
              No user found with phone number: <strong>{phoneNumber}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure the phone number is registered in the system
            </p>
          </div>
        )}
        
        {searchResult && (
          <AdminSearchCard
            result={searchResult}
            currentAdminUid={currentAdminData.uid}
            onPromote={handlePromoteClick}
            onDemote={handleDemoteClick}
            onActivate={handleActivateClick}
            onDeactivate={handleDeactivateClick}
            isLoading={isActionLoading}
          />
        )}
        
        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Important Information
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>All admin actions are logged with timestamps and performer details</li>
            <li>You cannot demote or deactivate yourself - ask another admin to do it</li>
            <li>Promoted admins get full access to the admin dashboard</li>
            <li>Demoted admins lose all admin privileges immediately</li>
            <li>Deactivated admins retain their role but lose dashboard access</li>
            <li>Activated admins regain full dashboard access</li>
          </ul>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {pendingAction && searchResult && (
        <ConfirmActionModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingAction(null);
          }}
          onConfirm={handleConfirmAction}
          action={pendingAction}
          userName={searchResult.user.name}
          isLoading={isActionLoading}
        />
      )}
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
