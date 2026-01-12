'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import VendorCard from '@/components/admin/UnverifiedVendors/VendorCard'
import VendorDetailsModal from '@/components/admin/UnverifiedVendors/VendorDetailsModal'
import { MdSearch, MdFilterList } from 'react-icons/md'

interface CityWithState {
  city: string
  state: string
}

interface Assignment {
  assignedBy: { name: string; phoneNumber: string }
  assignedTo: { name: string; phoneNumber: string }
  assignedAt: any
}

interface Rejection {
  rejectedBy: { name: string; phoneNumber: string }
  rejectedAt: any
  reason: string
}

interface Comment {
  adminName: string
  adminPhone: string
  comment: string
  timestamp: any
  timestampReadable: string
}

export interface UnverifiedVendor {
  id: string
  businessName: string
  ownerName: string
  phoneNumber: string
  alternativePhoneNumber?: string
  email?: string
  cities: CityWithState[]
  serviceCategories: string[]
  yearsOfExperience: number
  verificationStatus: 'unverified' | 'assigned' | 'rejected'
  createdAt: any
  createdAtReadable: string
  assignment?: Assignment
  rejection?: Rejection
  comments?: Comment[]
}

export default function UnverifiedVendorsPage() {
  const [vendors, setVendors] = useState<UnverifiedVendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<UnverifiedVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filters
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Modal
  const [selectedVendor, setSelectedVendor] = useState<UnverifiedVendor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filter options
  const [cities, setCities] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vendors, searchTerm, selectedCity, selectedState, selectedStatus])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const vendorsRef = collection(firestore, 'UnverifiedVendors')
      const q = query(vendorsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const vendorsList: UnverifiedVendor[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UnverifiedVendor))
      console.log('Fetched vendors:', vendorsList);
      
      setVendors(vendorsList)
      extractFilterOptions(vendorsList)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractFilterOptions = (vendorsList: UnverifiedVendor[]) => {
    const citySet = new Set<string>()
    const stateSet = new Set<string>()
    
    vendorsList.forEach(vendor => {
      vendor.cities.forEach(cityObj => {
        citySet.add(cityObj.city)
        stateSet.add(cityObj.state)
      })
    })
    
    setCities(Array.from(citySet).sort())
    setStates(Array.from(stateSet).sort())
  }

  const applyFilters = () => {
    let filtered = [...vendors]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(vendor => {
        const matchesBasic = 
          vendor.businessName.toLowerCase().includes(term) ||
          vendor.ownerName.toLowerCase().includes(term) ||
          vendor.phoneNumber.includes(term)
        
        const matchesAssignedTo = vendor.assignment?.assignedTo.name.toLowerCase().includes(term)
        
        return matchesBasic || matchesAssignedTo
      })
    }
    
    // City filter
    if (selectedCity) {
      filtered = filtered.filter(vendor =>
        vendor.cities.some(c => c.city === selectedCity)
      )
    }
    
    // State filter
    if (selectedState) {
      filtered = filtered.filter(vendor =>
        vendor.cities.some(c => c.state === selectedState)
      )
    }
    
    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(vendor => {
        if (selectedStatus === 'unassigned') {
          return vendor.verificationStatus === 'unverified'
        }
        return vendor.verificationStatus === selectedStatus
      })
    }
    
    setFilteredVendors(filtered)
  }

  const handleCardClick = (vendor: UnverifiedVendor) => {
    setSelectedVendor(vendor)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedVendor(null)
  }

  const handleVendorUpdate = () => {
    fetchVendors()
    handleModalClose()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCity('')
    setSelectedState('')
    setSelectedStatus('')
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'unverified':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unverified Vendors</h1>
          <p className="text-gray-600">Manage and verify vendor applications</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by business, owner, phone, or assigned admin..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCity || selectedState || selectedStatus) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Unassigned</p>
            <p className="text-2xl font-bold text-gray-700">
              {vendors.filter(v => v.verificationStatus === 'unverified').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Assigned</p>
            <p className="text-2xl font-bold text-yellow-600">
              {vendors.filter(v => v.verificationStatus === 'assigned').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {vendors.filter(v => v.verificationStatus === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Vendor Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No vendors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map(vendor => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onClick={() => handleCardClick(vendor)}
              />
            ))}
          </div>
        )}

        {/* Vendor Details Modal */}
        {selectedVendor && (
          <VendorDetailsModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            vendor={selectedVendor}
            onUpdate={handleVendorUpdate}
          />
        )}
      </div>
  )
}
