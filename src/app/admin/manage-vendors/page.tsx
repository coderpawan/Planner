'use client'

import { useState } from 'react'
import { doc, getDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, Timestamp, deleteField, updateDoc, deleteDoc } from 'firebase/firestore'
import { firestore, auth } from '@/lib/firebase-config'
import { MdSearch, MdStore, MdBlock, MdCheckCircle, MdDeleteForever, MdInfo } from 'react-icons/md'
import DeactivateVendorModal from '@/components/admin/ManageVendors/DeactivateVendorModal'
import ReactivateVendorModal from '@/components/admin/ManageVendors/ReactivateVendorModal'
import DeleteVendorModal from '@/components/admin/ManageVendors/DeleteVendorModal'
import VendorDetailsModal from '@/components/admin/ManageVendors/VendorDetailsModal'

interface CityData {
  city: string
  state: string
}

interface VendorData {
  vendorId: string
  businessName: string
  ownerName: string
  phoneNumber: string
  alternativePhoneNumber?: string
  email?: string
  cities: string[]
  citiesData?: CityData[]
  serviceCategories?: string[]
  yearsOfExperience?: number
  active: boolean
  uid: string
  verifiedAt?: {
    seconds: number
    nanoseconds: number
  }
  verifiedBy?: {
    name: string
    phoneNumber: string
  }
  activationHistory?: {
    deactivatedBy?: {
      adminName: string
      adminPhoneNumber: string
      reason: string
      date: string
      time: string
    }
    reactivatedBy?: {
      adminName: string
      adminPhoneNumber: string
      reason: string
      date: string
      time: string
    }
  }
}

interface AdminData {
  name: string
  phoneNumber: string
}

export default function ManageVendorsPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch admin data from localStorage
  const fetchAdminData = async (): Promise<AdminData | null> => {
    if (adminData) return adminData

    try {
      // Try to get from localStorage first
      const storedName = localStorage.getItem('name')
      const storedPhone = localStorage.getItem('phone')

      if (storedName && storedPhone) {
        const admin = {
          name: storedName,
          phoneNumber: storedPhone
        }
        setAdminData(admin)
        return admin
      }

      // Fallback to Firestore if not in localStorage
      const uid = auth.currentUser?.uid
      if (!uid) return null

      const userDoc = await getDoc(doc(firestore, 'Users', uid))
      if (!userDoc.exists()) return null

      const data = userDoc.data()
      const admin = {
        name: data.name || 'Admin',
        phoneNumber: data.phoneNumber || ''
      }
      
      // Store in localStorage for future use
      localStorage.setItem('name', admin.name)
      localStorage.setItem('phone', admin.phoneNumber)
      
      setAdminData(admin)
      return admin
    } catch (err) {
      console.error('Error fetching admin data:', err)
      return null
    }
  }

  // Search vendor by phone number
  const handleSearch = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      showToast('error', 'Please enter a valid 10-digit phone number')
      return
    }

    setSearching(true)
    setNotFound(false)
    setVendor(null)

    const fullPhone = `+91${phoneNumber}`

    try {
      // Search in VerifiedVendors
      const vendorsQuery = query(
        collection(firestore, 'VerifiedVendors'),
        where('phoneNumber', '==', fullPhone)
      )
      const vendorsSnap = await getDocs(vendorsQuery)

      if (vendorsSnap.empty) {
        setNotFound(true)
        return
      }

      const vendorDoc = vendorsSnap.docs[0]
      const vendorData = vendorDoc.data()

      // Fetch corresponding user document
      const usersQuery = query(
        collection(firestore, 'Users'),
        where('phoneNumber', '==', fullPhone)
      )
      const usersSnap = await getDocs(usersQuery)

      if (usersSnap.empty) {
        showToast('error', 'User document not found')
        return
      }

      const userDoc = usersSnap.docs[0]

      setVendor({
        vendorId: vendorDoc.id,
        businessName: vendorData.businessName || '',
        ownerName: vendorData.ownerName || '',
        phoneNumber: vendorData.phoneNumber || '',
        alternativePhoneNumber: vendorData.alternativePhoneNumber,
        email: vendorData.email,
        cities: vendorData.cities?.map((c: CityData) => c.city) || [],
        citiesData: vendorData.cities || [],
        serviceCategories: vendorData.serviceCategories || [],
        yearsOfExperience: vendorData.yearsOfExperience,
        active: vendorData.active !== false,
        uid: userDoc.id,
        verifiedAt: vendorData.verifiedAt,
        verifiedBy: vendorData.verifiedBy,
        activationHistory: vendorData.activationHistory
      })
    } catch (err) {
      console.error('Error searching vendor:', err)
      showToast('error', 'Failed to search vendor')
    } finally {
      setSearching(false)
    }
  }

  // Normalize city ID helper function
  const normalizeCityId = (cityName: string): string => {
    return cityName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '')
  }

  // Deactivate vendor
  const handleDeactivate = async (reason: string) => {
    if (!vendor) return

    setProcessing(true)
    setShowDeactivateModal(false)

    try {
      const admin = await fetchAdminData()
      if (!admin) {
        showToast('error', 'Failed to fetch admin data')
        setProcessing(false)
        return
      }

      const batch = writeBatch(firestore)
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-IN')
      const timeStr = now.toLocaleTimeString('en-IN')

      // Update VerifiedVendors
      const vendorRef = doc(firestore, 'VerifiedVendors', vendor.vendorId)
      batch.update(vendorRef, {
        active: false,
        'activationHistory.deactivatedBy': {
          adminName: admin.name,
          adminPhoneNumber: admin.phoneNumber,
          reason,
          date: dateStr,
          time: timeStr
        }
      })

      // Update Users role
      const userRef = doc(firestore, 'Users', vendor.uid)
      batch.update(userRef, {
        role: 'User'
      })

      // Disable vendor services across all cities
      const categoryIds = [
        'venue',
      'catering',
      'decor',
      'photography',
      'makeup_styling',
      'music_entertainment',
      'choreography',
      'ritual_services',
      'wedding_transport',
      'invitations_gifting',
      'wedding_planner'
      ]

      for (const cityObj of (vendor.citiesData || [])) {
        const cityId = normalizeCityId(cityObj.city)
        for (const categoryId of categoryIds) {
          const servicesQuery = query(
            collection(firestore, `vendor_services/${cityId}/${categoryId}`),
            where('vendorId', '==', vendor.vendorId)
          )
          const servicesSnap = await getDocs(servicesQuery)

          servicesSnap.docs.forEach((serviceDoc) => {
            batch.update(serviceDoc.ref, { active: false })
          })
        }
      }

      await batch.commit()

      setVendor({ ...vendor, active: false })
      showToast('success', 'Vendor deactivated successfully')
    } catch (err) {
      console.error('Error deactivating vendor:', err)
      showToast('error', 'Failed to deactivate vendor')
    } finally {
      setProcessing(false)
    }
  }

  // Reactivate vendor
  const handleReactivate = async (reason: string) => {
    if (!vendor) return

    setProcessing(true)
    setShowReactivateModal(false)

    try {
      const admin = await fetchAdminData()
      if (!admin) {
        showToast('error', 'Failed to fetch admin data')
        setProcessing(false)
        return
      }

      const batch = writeBatch(firestore)
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-IN')
      const timeStr = now.toLocaleTimeString('en-IN')

      // Update VerifiedVendors
      const vendorRef = doc(firestore, 'VerifiedVendors', vendor.vendorId)
      batch.update(vendorRef, {
        active: true,
        'activationHistory.reactivatedBy': {
          adminName: admin.name,
          adminPhoneNumber: admin.phoneNumber,
          reason,
          date: dateStr,
          time: timeStr
        }
      })

      // Update Users role
      const userRef = doc(firestore, 'Users', vendor.uid)
      batch.update(userRef, {
        role: 'Vendor'
      })

      // Re-enable vendor services across all cities
      const categoryIds = [
        'venue',
      'catering',
      'decor',
      'photography',
      'makeup_styling',
      'music_entertainment',
      'choreography',
      'ritual_services',
      'wedding_transport',
      'invitations_gifting',
      'wedding_planner'
      ]

      for (const cityObj of (vendor.citiesData || [])) {
        const cityId = normalizeCityId(cityObj.city)
        for (const categoryId of categoryIds) {
          const servicesQuery = query(
            collection(firestore, `vendor_services/${cityId}/${categoryId}`),
            where('vendorId', '==', vendor.vendorId)
          )
          const servicesSnap = await getDocs(servicesQuery)

          servicesSnap.docs.forEach((serviceDoc) => {
            batch.update(serviceDoc.ref, { active: true })
          })
        }
      }

      await batch.commit()

      setVendor({ ...vendor, active: true })
      showToast('success', 'Vendor reactivated successfully')
    } catch (err) {
      console.error('Error reactivating vendor:', err)
      showToast('error', 'Failed to reactivate vendor')
    } finally {
      setProcessing(false)
    }
  }

  // Permanent delete vendor
  const handlePermanentDelete = async (reason: string) => {
    if (!vendor) return

    setProcessing(true)
    setShowDeleteModal(false)

    try {
      const admin = await fetchAdminData()
      if (!admin) {
        showToast('error', 'Failed to fetch admin data')
        setProcessing(false)
        return
      }

      const batch = writeBatch(firestore)
      const now = Timestamp.now()
      const deleteAfter = new Date(now.toMillis() + 90 * 24 * 60 * 60 * 1000) // 90 days
      const dateStr = new Date().toLocaleDateString('en-IN')
      const timeStr = new Date().toLocaleTimeString('en-IN')

      // Collect all serviceIds for cleanup
      const deletedServiceIds: string[] = []

      // Delete vendor services across all cities
      const categoryIds = [
        'venue',
      'catering',
      'decor',
      'photography',
      'makeup_styling',
      'music_entertainment',
      'choreography',
      'ritual_services',
      'wedding_transport',
      'invitations_gifting',
      'wedding_planner'
      ]

      for (const cityObj of (vendor.citiesData || [])) {
        const cityId = normalizeCityId(cityObj.city)
        for (const categoryId of categoryIds) {
          const servicesQuery = query(
            collection(firestore, `vendor_services/${cityId}/${categoryId}`),
            where('vendorId', '==', vendor.vendorId)
          )
          const servicesSnap = await getDocs(servicesQuery)

          servicesSnap.docs.forEach((serviceDoc) => {
            deletedServiceIds.push(serviceDoc.id)
            batch.delete(serviceDoc.ref)
          })
        }
      }

      // Delete service availability entries - query directly from collection
      const availabilityQuery = query(
        collection(firestore, 'service_availability'),
        where('vendorId', '==', vendor.vendorId)
      )
      const availabilitySnap = await getDocs(availabilityQuery)

      availabilitySnap.docs.forEach((availDoc) => {
        batch.delete(availDoc.ref)
      })

      // Commit batch for service deletions
      await batch.commit()

      // CLEANUP: Remove deleted services from cart collection
      try {
        const cartSnapshot = await getDocs(collection(firestore, 'cart'))
        
        for (const cartDoc of cartSnapshot.docs) {
          const updates: Record<string, any> = {}
          let hasUpdates = false

          for (const serviceId of deletedServiceIds) {
            if (cartDoc.data()[serviceId]) {
              updates[serviceId] = deleteField()
              hasUpdates = true
            }
          }

          if (hasUpdates) {
            await updateDoc(cartDoc.ref, updates)
          }
        }
      } catch (err) {
        console.error('Error cleaning cart:', err)
      }

      // CLEANUP: Remove deleted services from unlocked_services collection
      try {
        const unlockedSnapshot = await getDocs(collection(firestore, 'unlocked_services'))
        
        for (const unlockedDoc of unlockedSnapshot.docs) {
          const services = unlockedDoc.data().services || []
          const filteredServices = services.filter((sid: string) => !deletedServiceIds.includes(sid))

          if (filteredServices.length !== services.length) {
            await updateDoc(unlockedDoc.ref, {
              services: filteredServices
            })
          }
        }
      } catch (err) {
        console.error('Error cleaning unlocked_services:', err)
      }

      // CLEANUP: Delete entire user_engagements document for this vendor
      try {
        const engagementRef = doc(firestore, 'user_engagements', vendor.vendorId)
        const engagementDoc = await getDoc(engagementRef)

        if (engagementDoc.exists()) {
          await deleteDoc(engagementRef)
        }
      } catch (err) {
        console.error('Error cleaning user_engagements:', err)
      }

      // Create new batch for final deletions and tombstone
      const finalBatch = writeBatch(firestore)

      // Delete VerifiedVendors document
      const vendorRef = doc(firestore, 'VerifiedVendors', vendor.vendorId)
      finalBatch.delete(vendorRef)

      // Update Users document - remove vendorId field
      const userRef = doc(firestore, 'Users', vendor.uid)
      finalBatch.update(userRef, {
        role: 'User',
        vendorId: deleteField()
      })

      // Create tombstone in deleted_vendors
      const deletedVendorRef = doc(firestore, 'deleted_vendors', vendor.vendorId)
      finalBatch.set(deletedVendorRef, {
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        phoneNumber: vendor.phoneNumber,
        reason,
        deletedBy: {
          adminName: admin.name,
          adminPhoneNumber: admin.phoneNumber
        },
        deletedAt: {
          date: dateStr,
          time: timeStr,
          timestamp: now
        },
        deleteAfter: Timestamp.fromDate(deleteAfter)
      })

      await finalBatch.commit()

      setVendor(null)
      showToast('success', 'Vendor permanently deleted')
    } catch (err) {
      console.error('Error deleting vendor:', err)
      showToast('error', 'Failed to delete vendor')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Vendors</h1>

      {/* SEARCH */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex gap-3">
          <span className="px-4 py-3 bg-gray-100 rounded-l-lg">+91</span>
          <input
            value={phoneNumber}
            onChange={(e) =>
              setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            placeholder="9876543210"
            className="flex-1 border px-4 py-3 rounded-r-lg"
            disabled={processing}
          />
          <button
            onClick={handleSearch}
            disabled={searching || processing}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
          >
            <MdSearch className="text-xl" />
          </button>
        </div>
      </div>

      {notFound && (
        <div className="bg-red-100 p-4 rounded-lg text-red-700">
          Vendor not found with this phone number
        </div>
      )}

      {vendor && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              vendor.active ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <MdStore className={`text-2xl ${
                vendor.active ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{vendor.businessName}</h2>
              <p className="text-gray-600">{vendor.ownerName}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
              vendor.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {vendor.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <p><strong>Phone:</strong> {vendor.phoneNumber}</p>
            <p><strong>Cities:</strong> {vendor.cities.join(', ')}</p>
            <p><strong>Vendor ID:</strong> {vendor.vendorId}</p>
          </div>

          {/* Activation History */}
          {vendor.activationHistory && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Activation History</h3>
              {vendor.activationHistory.deactivatedBy && (
                <div className="text-sm mb-2">
                  <p className="text-red-600 font-medium">Deactivated:</p>
                  <p>By: {vendor.activationHistory.deactivatedBy.adminName}</p>
                  <p>Reason: {vendor.activationHistory.deactivatedBy.reason}</p>
                  <p>Date: {vendor.activationHistory.deactivatedBy.date} at {vendor.activationHistory.deactivatedBy.time}</p>
                </div>
              )}
              {vendor.activationHistory.reactivatedBy && (
                <div className="text-sm">
                  <p className="text-green-600 font-medium">Reactivated:</p>
                  <p>By: {vendor.activationHistory.reactivatedBy.adminName}</p>
                  <p>Reason: {vendor.activationHistory.reactivatedBy.reason}</p>
                  <p>Date: {vendor.activationHistory.reactivatedBy.date} at {vendor.activationHistory.reactivatedBy.time}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <MdInfo />
              View Details
            </button>

            {vendor.active ? (
              <button
                onClick={() => setShowDeactivateModal(true)}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <MdBlock />
                Deactivate Vendor
              </button>
            ) : (
              <button
                onClick={() => setShowReactivateModal(true)}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <MdCheckCircle />
                Reactivate Vendor
              </button>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-6 pt-6 border-t border-red-200">
            <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <MdDeleteForever />
              Permanently Delete Vendor
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <VendorDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        vendor={vendor}
      />

      <DeactivateVendorModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivate}
        vendorName={vendor?.businessName || ''}
      />

      <ReactivateVendorModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleReactivate}
        vendorName={vendor?.businessName || ''}
      />

      <DeleteVendorModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handlePermanentDelete}
        vendorName={vendor?.businessName || ''}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
