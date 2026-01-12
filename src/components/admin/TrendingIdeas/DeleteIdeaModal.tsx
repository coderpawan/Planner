'use client'

import React from 'react'
import { MdClose, MdWarning } from 'react-icons/md'

interface DeleteIdeaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  ideaTitle: string
  isDeleting: boolean
}

export default function DeleteIdeaModal({ isOpen, onClose, onConfirm, ideaTitle, isDeleting }: DeleteIdeaModalProps) {
  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <MdWarning className="text-4xl text-red-500" />
            </div>
            <div>
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this trending idea?
              </p>
              <p className="font-semibold text-gray-900">"{ideaTitle}"</p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
