'use client'

import { useState } from 'react'
import { MdClose, MdBlock } from 'react-icons/md'

interface DeactivateVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  vendorName: string
}

export default function DeactivateVendorModal({
  isOpen,
  onClose,
  onConfirm,
  vendorName
}: DeactivateVendorModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!reason.trim()) return
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Deactivate Vendor</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to deactivate <strong>{vendorName}</strong>. This action will:
        </p>

        <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
          <li>Set vendor status to inactive</li>
          <li>Change user role to "User"</li>
          <li>Disable all vendor services</li>
          <li>This action is reversible</li>
        </ul>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for deactivation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for deactivating this vendor..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MdBlock />
            Deactivate
          </button>
        </div>
      </div>
    </div>
  )
}
