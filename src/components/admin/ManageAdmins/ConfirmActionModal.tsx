'use client';

import React from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'promote' | 'demote' | 'activate' | 'deactivate';
  userName: string;
  isLoading?: boolean;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  userName,
  isLoading = false,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const actionConfig = {
    promote: {
      color: 'green',
      icon: '✓',
      title: 'Promote to Admin',
      question: `Are you sure you want to promote ${userName} to Admin?`,
      actions: [
        'Grant full admin dashboard access',
        'Allow managing vendors, services, and users',
        'Record this promotion in audit logs',
      ],
      confirmText: 'Yes, Promote to Admin',
    },
    demote: {
      color: 'red',
      icon: '⚠️',
      title: 'Remove Admin Rights',
      question: `Are you sure you want to remove admin rights from ${userName}?`,
      actions: [
        'Revoke all admin dashboard access',
        'Change their role back to regular user',
        'Record this demotion in audit logs',
      ],
      confirmText: 'Yes, Remove Admin',
    },
    activate: {
      color: 'blue',
      icon: '🔓',
      title: 'Activate Admin',
      question: `Are you sure you want to activate ${userName}'s admin access?`,
      actions: [
        'Re-enable admin dashboard access',
        'Restore all admin privileges',
        'Record this activation in audit logs',
      ],
      confirmText: 'Yes, Activate Admin',
    },
    deactivate: {
      color: 'orange',
      icon: '🔒',
      title: 'Deactivate Admin',
      question: `Are you sure you want to deactivate ${userName}'s admin access?`,
      actions: [
        'Temporarily disable admin dashboard access',
        'Keep admin role but remove privileges',
        'Record this deactivation in audit logs',
      ],
      confirmText: 'Yes, Deactivate Admin',
    },
  };

  const config = actionConfig[action];

  const bgColor =
    config.color === 'green'
      ? 'bg-green-100'
      : config.color === 'red'
      ? 'bg-red-100'
      : config.color === 'blue'
      ? 'bg-blue-100'
      : 'bg-orange-100';

  const borderColor =
    config.color === 'green'
      ? 'border-green-200'
      : config.color === 'red'
      ? 'border-red-200'
      : config.color === 'blue'
      ? 'border-blue-200'
      : 'border-orange-200';

  const btnColor =
    config.color === 'green'
      ? 'bg-green-600 hover:bg-green-700'
      : config.color === 'red'
      ? 'bg-red-600 hover:bg-red-700'
      : config.color === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-orange-600 hover:bg-orange-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}>
            <span className="text-2xl">{config.icon}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">{config.question}</p>

          <div className={`p-3 rounded-md text-sm ${bgColor} border ${borderColor}`}>
            <p className="font-medium mb-2">This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {config.actions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed ${btnColor} disabled:bg-gray-400 text-white`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              config.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
