'use client'

import { useState } from 'react'
import { ref, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase-config'
import { MdClose, MdWarning, MdDelete } from 'react-icons/md'
import { deleteVendorService } from '@/lib/firestore-services'
import { VendorServiceDoc } from '@/lib/firestore-utils'

interface DeleteServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service: VendorServiceDoc
  mode?: 'admin' | 'vendor'
}

export default function DeleteServiceModal({ isOpen, onClose, onSuccess, service, mode = 'vendor' }: DeleteServiceModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [deletionProgress, setDeletionProgress] = useState('')

  if (!isOpen) return null

  const extractStoragePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const match = pathname.match(/\/o\/(.+)/)
      if (match) {
        return decodeURIComponent(match[1])
      }
      return null
    } catch (error) {
      console.error('Error parsing URL:', error)
      return null
    }
  }

  const deleteServiceImages = async () => {
    if (!service.images || service.images.length === 0) return

    setDeletionProgress('Deleting images...')
    const deletePromises = service.images.map(async (imageUrl: string) => {
      try {
        const path = extractStoragePathFromUrl(imageUrl)
        if (path) {
          const storageRef = ref(storage, path)
          await deleteObject(storageRef)
          console.log('Deleted image:', path)
        }
      } catch (error) {
        console.error('Error deleting image:', imageUrl, error)
        // Continue even if one image fails
      }
    })

    await Promise.all(deletePromises)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // Step 1: Delete images from storage
      await deleteServiceImages()

      setDeletionProgress('Deleting service and related data...')
      
      // Step 2: Delete service and all related data using new Firestore function
      // This will handle: service doc, availability docs, bookings, reviews, 
      // cart references, unlocked_services, and user_engagements
      await deleteVendorService(service.cityId, service.serviceCategory, service.serviceId)

      setDeletionProgress('Complete!')
      alert('Service and all related data deleted successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error during service deletion:', error)
      alert('Failed to delete service. Please try again or contact support.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdWarning className="text-3xl text-white" />
            <h3 className="text-xl font-bold text-white">Delete Service</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={deleting}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <MdClose className="text-xl text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-900 font-semibold mb-2">
              Are you sure you want to delete this service?
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="font-bold text-gray-900">{service.serviceName}</p>
              <p className="text-sm text-gray-600">{service.serviceCategory}</p>
              <p className="text-sm text-gray-600">{service.city}, {service.state}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-red-700">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 space-y-1 list-disc">
                <li>All service images ({service.images?.length || 0} images)</li>
                <li>All bookings for this service</li>
                <li>All availability/calendar entries</li>
                <li>All customer reviews</li>
                <li>References from user carts</li>
                <li>References from unlocked services</li>
                <li>References from user engagements</li>
                <li>The service listing itself</li>
              </ul>
            </div>
          </div>

          {deleting && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800 font-medium">{deletionProgress}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <MdDelete className="text-xl" />
                  Delete Service
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
