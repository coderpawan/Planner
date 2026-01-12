'use client'

import { UnverifiedVendor } from '@/app/admin/unverified-vendors/page'
import { MdBusiness, MdPhone } from 'react-icons/md'

interface VendorCardProps {
  vendor: UnverifiedVendor
  onClick: () => void
}

export default function VendorCard({ vendor, onClick }: VendorCardProps) {
  const getStatusColor = () => {
    switch (vendor.verificationStatus) {
      case 'unverified':
        return 'bg-gray-50 border-gray-300'
      case 'assigned':
        return 'bg-yellow-50 border-yellow-300'
      case 'rejected':
        return 'bg-red-50 border-red-300'
      default:
        return 'bg-gray-50 border-gray-300'
    }
  }

  const getStatusBadge = () => {
    const status = vendor.verificationStatus === 'unverified' ? 'unassigned' : vendor.verificationStatus
    const colors = {
      unassigned: 'bg-gray-100 text-gray-700 border-gray-300',
      assigned: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      rejected: 'bg-red-100 text-red-700 border-red-300'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`${getStatusColor()} border-2 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
    >
      <div className="space-y-4">
        {/* Business Name */}
        <div className="flex items-start gap-3">
          <MdBusiness className="text-2xl text-gray-600 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-1">Business Name</p>
            <p className="text-lg font-bold text-gray-900 truncate">{vendor.businessName}</p>
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-3">
          <MdPhone className="text-xl text-gray-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Phone</p>
            <p className="text-base font-medium text-gray-900">{vendor.phoneNumber}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          {getStatusBadge()}
          <span className="text-xs text-gray-500">{vendor.createdAtReadable}</span>
        </div>
      </div>
    </div>
  )
}
