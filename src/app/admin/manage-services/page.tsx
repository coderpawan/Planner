'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { MdSearch, MdStore, MdPhone, MdLocationOn, MdCheckCircle, MdBlock, MdCategory } from 'react-icons/md'
import ServiceManager from '@/components/admin/ServiceManager'
import { getCategoryLabelsMap } from '@/lib/firestore-services'

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
  cities: CityData[]
  active: boolean
  serviceCategories?: string[]
}

export default function ManageServicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({})

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch category labels on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const labels = await getCategoryLabelsMap()
      setCategoryLabels(labels)
    }
    
    fetchCategories()
  }, [])

  // Load vendor from URL parameters on mount
  useEffect(() => {
    const loadVendorFromUrl = async () => {
      const vendorId = searchParams.get('vendorId')
      const phone = searchParams.get('phone')
      
      if (vendorId) {
        try {
          // Fetch vendor by ID
          const vendorDoc = await getDoc(doc(firestore, 'VerifiedVendors', vendorId))
          
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data()
            setVendor({
              vendorId: vendorDoc.id,
              businessName: vendorData.businessName || 'N/A',
              ownerName: vendorData.ownerName || 'N/A',
              phoneNumber: vendorData.phoneNumber || 'N/A',
              alternativePhoneNumber: vendorData.alternativePhoneNumber,
              cities: vendorData.cities || [],
              active: vendorData.active !== false,
              serviceCategories: vendorData.serviceCategories || []
            })
            
            // Restore phone number in search box
            if (phone) {
              setPhoneNumber(phone)
            }
          }
        } catch (error) {
          console.error('Error loading vendor from URL:', error)
        }
      }
      
      setInitializing(false)
    }

    loadVendorFromUrl()
  }, [searchParams])

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
        showToast('error', 'Vendor not found')
        return
      }

      const vendorDoc = vendorsSnap.docs[0]
      const vendorData = vendorDoc.data()

      const vendorInfo = {
        vendorId: vendorDoc.id,
        businessName: vendorData.businessName || 'N/A',
        ownerName: vendorData.ownerName || 'N/A',
        phoneNumber: vendorData.phoneNumber || 'N/A',
        alternativePhoneNumber: vendorData.alternativePhoneNumber,
        cities: vendorData.cities || [],
        active: vendorData.active !== false,
        serviceCategories: vendorData.serviceCategories || []
      }
      
      setVendor(vendorInfo)

      // Update URL with vendor data to persist state
      const params = new URLSearchParams()
      params.set('vendorId', vendorDoc.id)
      params.set('phone', phoneNumber)
      router.push(`/admin/manage-services?${params.toString()}`, { scroll: false })

      showToast('success', 'Vendor found successfully')
    } catch (error) {
      console.error('Error searching vendor:', error)
      showToast('error', 'Failed to search vendor')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Show loading state while initializing from URL
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Services</h1>
          <p className="text-gray-600 mt-2">Search vendors by phone number and manage their services</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Vendor</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                +91
              </div>
              <input
                type="text"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 10) {
                    setPhoneNumber(value)
                  }
                }}
                onKeyPress={handleKeyPress}
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Searching...
                </>
              ) : (
                <>
                  <MdSearch className="text-xl" />
                  Search
                </>
              )}
            </button>
          </div>

          {notFound && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">Vendor not found</p>
              <p className="text-sm mt-1">No vendor found with phone number +91{phoneNumber}</p>
            </div>
          )}
        </div>

        {/* Vendor Summary Section */}
        {vendor && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MdStore className="text-4xl text-pink-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h2>
                    <p className="text-gray-600">{vendor.ownerName}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                  vendor.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.active ? (
                    <>
                      <MdCheckCircle className="text-xl" />
                      Active
                    </>
                  ) : (
                    <>
                      <MdBlock className="text-xl" />
                      Deactivated
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <MdPhone className="text-xl text-pink-600" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{vendor.phoneNumber}</p>
                  </div>
                </div>

                {vendor.alternativePhoneNumber && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MdPhone className="text-xl text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Alternative Phone</p>
                      <p className="font-medium">{vendor.alternativePhoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-gray-700">
                  <MdLocationOn className="text-xl text-red-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Operational Cities</p>
                    <p className="font-medium">
                      {vendor.cities.map(c => `${c.city}, ${c.state}`).join(' • ')}
                    </p>
                  </div>
                </div>

                {vendor.serviceCategories && vendor.serviceCategories.length > 0 && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <MdCategory className="text-xl text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Service Categories</p>
                      <p className="font-medium">
                        {vendor.serviceCategories
                          .map(cat => categoryLabels[cat] || cat)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-gray-700">
                  <div>
                    <p className="text-sm text-gray-500">Vendor ID</p>
                    <p className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {vendor.vendorId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section - Reuse Vendor Dashboard Component */}
            <ServiceManager vendorId={vendor.vendorId} mode="admin" />
          </>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-medium z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}
