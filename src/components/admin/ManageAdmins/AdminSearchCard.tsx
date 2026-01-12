'use client';

import React from 'react';
import { SearchResult } from '@/lib/firestore-admin-management';

interface AdminSearchCardProps {
  result: SearchResult;
  currentAdminUid: string;
  onPromote: () => void;
  onDemote: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  isLoading?: boolean;
}

export default function AdminSearchCard({
  result,
  currentAdminUid,
  onPromote,
  onDemote,
  onActivate,
  onDeactivate,
  isLoading = false,
}: AdminSearchCardProps) {
  const { user, admin, isAdmin } = result;
  
  // Determine if the current admin can perform actions on this user
  const isSelf = user.uid === currentAdminUid;
  
  // Format timestamps
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch {
      return 'N/A';
    }
  };
  
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
      if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      return 'just now';
    } catch {
      return '';
    }
  };
  
  // Determine status display
  const getStatusDisplay = () => {
    if (!admin) {
      // Never been an admin
      return {
        title: 'Never an Admin',
        variant: 'neutral' as const,
        details: null,
      };
    }
    
    if (admin.active && isAdmin) {
      // Currently an active admin
      return {
        title: 'Active Admin',
        variant: 'success' as const,
        details: (
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="font-medium">Promoted By:</span>{' '}
              {admin.promotedByName}
            </p>
            <p>
              <span className="font-medium">Promoted On:</span>{' '}
              {formatTimestamp(admin.promotedAt)}
              <span className="text-gray-500 ml-2">
                ({formatRelativeTime(admin.promotedAt)})
              </span>
            </p>
          </div>
        ),
      };
    }
    
    if (!admin.active || !isAdmin) {
      // Was an admin but demoted
      return {
        title: 'Previously Admin',
        variant: 'warning' as const,
        details: (
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="font-medium">Promoted On:</span>{' '}
              {formatTimestamp(admin.promotedAt)}
            </p>
            {admin.demotedBy && (
              <>
                <p>
                  <span className="font-medium">Demoted By:</span>{' '}
                  {admin.demotedByName}
                </p>
                <p>
                  <span className="font-medium">Demoted On:</span>{' '}
                  {formatTimestamp(admin.demotedAt)}
                  <span className="text-gray-500 ml-2">
                    ({formatRelativeTime(admin.demotedAt)})
                  </span>
                </p>
              </>
            )}
          </div>
        ),
      };
    }
    
    return {
      title: 'Unknown Status',
      variant: 'neutral' as const,
      details: null,
    };
  };
  
  const statusDisplay = getStatusDisplay();
  
  // Status badge styling
  const statusBadgeClasses = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Basic Info Section */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {user.name}
        </h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Phone:</span> {user.phoneNumber}
          </p>
          <p>
            <span className="font-medium">User ID:</span> {user.uid}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-medium">Current Role:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'Admin'
                  ? 'bg-purple-100 text-purple-800'
                  : user.role === 'Vendor'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>
      
      {/* Admin Status Section */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Admin Status
        </h4>
        <div
          className={`inline-block px-4 py-2 rounded-md border ${
            statusBadgeClasses[statusDisplay.variant]
          }`}
        >
          <span className="font-semibold">{statusDisplay.title}</span>
        </div>
        {statusDisplay.details && (
          <div className="mt-3 text-gray-700">{statusDisplay.details}</div>
        )}
      </div>
      
      {/* Action Buttons Section */}
      <div className="space-y-3">
        {/* Promote/Demote Buttons */}
        <div className="flex gap-3">
          {!isAdmin && (
            <button
              onClick={onPromote}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : '✓ Make Admin'}
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={onDemote}
              disabled={isLoading || isSelf}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              title={isSelf ? 'You cannot demote yourself' : ''}
            >
              {isLoading
                ? 'Processing...'
                : isSelf
                ? '✗ Cannot Demote Self'
                : '✗ Remove Admin'}
            </button>
          )}
        </div>
        
        {/* Activate/Deactivate Buttons (only for existing admins) */}
        {isAdmin && admin && (
          <div className="flex gap-3">
            {!admin.active ? (
              <button
                onClick={onActivate}
                disabled={isLoading || isSelf}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                title={isSelf ? 'You cannot activate yourself' : ''}
              >
                {isLoading ? 'Processing...' : '🔓 Activate Admin'}
              </button>
            ) : (
              <button
                onClick={onDeactivate}
                disabled={isLoading || isSelf}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                title={isSelf ? 'You cannot deactivate yourself' : ''}
              >
                {isLoading
                  ? 'Processing...'
                  : isSelf
                  ? '🔒 Cannot Deactivate Self'
                  : '🔒 Deactivate Admin'}
              </button>
            )}
          </div>
        )}
      </div>
      
      {isSelf && isAdmin && (
        <p className="mt-3 text-sm text-red-600 text-center">
          ⚠️ You cannot demote or deactivate yourself
        </p>
      )}
    </div>
  );
}
