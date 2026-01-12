'use client'

import { MdClose, MdStore, MdEmail, MdPhone, MdLocationCity, MdWork, MdVerified } from 'react-icons/md'

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
  verifiedAt?: {
    seconds: number
    nanoseconds: number
  }
  verifiedBy?: {
    name: string
    phoneNumber: string
  }
}

interface VendorDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  vendor: VendorData | null
}

export default function VendorDetailsModal({
  isOpen,
  onClose,
  vendor
}: VendorDetailsModalProps) {
  if (!isOpen || !vendor) return null

  const formatTimestamp = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp.seconds * 1000)
    return date.toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'long'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MdStore className="text-xl text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MdStore className="text-pink-500" />
              Basic Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-700 w-48">Business Name:</span>
                <span className="text-gray-900">{vendor.businessName}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-48">Owner Name:</span>
                <span className="text-gray-900">{vendor.ownerName}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-48">Vendor ID:</span>
                <span className="text-gray-900 font-mono text-sm">{vendor.vendorId}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-48">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vendor.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MdPhone className="text-pink-500" />
              Contact Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-700 w-48">Primary Phone:</span>
                <span className="text-gray-900">{vendor.phoneNumber}</span>
              </div>
              {vendor.alternativePhoneNumber && (
                <div className="flex">
                  <span className="font-medium text-gray-700 w-48">Alternative Phone:</span>
                  <span className="text-gray-900">{vendor.alternativePhoneNumber}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex">
                  <span className="font-medium text-gray-700 w-48">Email:</span>
                  <span className="text-gray-900">{vendor.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MdLocationCity className="text-pink-500" />
              Operating Cities
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {vendor.citiesData && vendor.citiesData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {vendor.citiesData.map((cityData, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded">
                      <MdLocationCity className="text-pink-500" />
                      <div>
                        <p className="font-medium text-gray-900">{cityData.city}</p>
                        <p className="text-sm text-gray-600">{cityData.state}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No cities available</p>
              )}
            </div>
          </div>

          {/* Service Categories */}
          {vendor.serviceCategories && vendor.serviceCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdWork className="text-pink-500" />
                Service Categories
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {vendor.serviceCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium capitalize"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Experience */}
          {vendor.yearsOfExperience !== undefined && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Years of Experience</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-pink-600">{vendor.yearsOfExperience} years</p>
              </div>
            </div>
          )}

          {/* Verification Information */}
          {vendor.verifiedBy && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdVerified className="text-pink-500" />
                Verification Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-48">Verified At:</span>
                  <span className="text-gray-900">{formatTimestamp(vendor.verifiedAt)}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-48">Verified By:</span>
                  <span className="text-gray-900">{vendor.verifiedBy.name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-48">Verifier Phone:</span>
                  <span className="text-gray-900">{vendor.verifiedBy.phoneNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
