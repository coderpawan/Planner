'use client'

import { useState } from 'react'
import { MdClose, MdDeleteForever, MdWarning } from 'react-icons/md'

interface DeleteVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  vendorName: string
}

export default function DeleteVendorModal({
  isOpen,
  onClose,
  onConfirm,
  vendorName
}: DeleteVendorModalProps) {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [showSecondConfirm, setShowSecondConfirm] = useState(false)

  if (!isOpen) return null

  const handleFirstConfirm = () => {
    if (!reason.trim()) return
    setShowSecondConfirm(true)
  }

  const handleFinalConfirm = () => {
    if (confirmText !== 'DELETE') return
    onConfirm(reason)
    setReason('')
    setConfirmText('')
    setShowSecondConfirm(false)
  }

  const handleClose = () => {
    setReason('')
    setConfirmText('')
    setShowSecondConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <MdWarning className="text-2xl" />
            Permanently Delete Vendor
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {!showSecondConfirm ? (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ WARNING: This action is IRREVERSIBLE!</p>
              <p className="text-red-700 text-sm">
                You are about to permanently delete <strong>{vendorName}</strong>.
              </p>
            </div>

            <p className="text-gray-600 mb-4">This action will:</p>

            <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
              <li>Delete all vendor services across all cities</li>
              <li>Delete vendor profile from VerifiedVendors</li>
              <li>Change user role to "User" and remove vendorId</li>
              <li>Create a tombstone record (auto-deleted after 90 days)</li>
              <li><strong className="text-red-600">Bookings and availability data remain untouched</strong></li>
            </ul>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter detailed reason for permanently deleting this vendor..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">🚨 FINAL CONFIRMATION</p>
              <p className="text-red-700 text-sm">
                Type <strong>DELETE</strong> to confirm permanent deletion of <strong>{vendorName}</strong>
              </p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border-2 border-red-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSecondConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={confirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MdDeleteForever />
                Delete Forever
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
