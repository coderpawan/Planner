'use client';

import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/lib/firebase-config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DebugAuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [localStorageRole, setLocalStorageRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage
    const role = localStorage.getItem('role');
    setLocalStorageRole(role);
    console.log('localStorage role:', role);

    // Listen to auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        console.log('Auth user:', currentUser.uid, currentUser.phoneNumber);
        
        // Fetch from Firestore
        try {
          const userDoc = await getDoc(doc(firestore, 'Users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFirestoreData(data);
            console.log('Firestore data:', data);
          } else {
            console.log('No Firestore document found');
          }
        } catch (error) {
          console.error('Error fetching Firestore data:', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="space-y-6">
        {/* localStorage */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">localStorage Role</h2>
          <p className="font-mono text-sm">
            {localStorageRole || 'null'}
          </p>
          <button
            onClick={() => {
              const role = localStorage.getItem('role');
              setLocalStorageRole(role);
              alert(`localStorage role: ${role}`);
            }}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Refresh localStorage
          </button>
        </div>

        {/* Firebase Auth */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Firebase Auth User</h2>
          {user ? (
            <div className="space-y-1 text-sm">
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Phone:</strong> {user.phoneNumber}</p>
              <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated</p>
          )}
        </div>

        {/* Firestore Data */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Firestore Users/{user?.uid}</h2>
          {firestoreData ? (
            <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
              {JSON.stringify(firestoreData, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">No Firestore data</p>
          )}
        </div>

        {/* Match Check */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Consistency Check</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>localStorage role:</strong>{' '}
              <span className={localStorageRole === 'Admin' ? 'text-green-600' : 'text-red-600'}>
                {localStorageRole || 'null'}
              </span>
            </p>
            <p>
              <strong>Firestore role:</strong>{' '}
              <span className={firestoreData?.role === 'Admin' ? 'text-green-600' : 'text-red-600'}>
                {firestoreData?.role || 'null'}
              </span>
            </p>
            <p>
              <strong>Match:</strong>{' '}
              <span className={localStorageRole === firestoreData?.role ? 'text-green-600' : 'text-red-600'}>
                {localStorageRole === firestoreData?.role ? '✓ Yes' : '✗ No'}
              </span>
            </p>
          </div>
          
          {localStorageRole !== firestoreData?.role && (
            <button
              onClick={() => {
                if (firestoreData?.role) {
                  localStorage.setItem('role', firestoreData.role);
                  setLocalStorageRole(firestoreData.role);
                  alert(`Updated localStorage role to: ${firestoreData.role}`);
                }
              }}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded"
            >
              Sync localStorage with Firestore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
