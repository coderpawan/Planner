'use client'

import Image from 'next/image'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import { formatPrice, formatPricingUnit } from '@/config/weddingBudgetConfig'
import { MdStar, MdLocationOn, MdWorkOutline, MdDelete } from 'react-icons/md'
import { useState } from 'react'
import { removeFromCart } from '@/lib/cartUtils'

interface CartServiceCardProps {
  service: VendorServiceDoc
  onShowDetails: () => void
  onRemove: () => void
  uid: string
}

export default function CartServiceCard({ service, onShowDetails, onRemove, uid }: CartServiceCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const primaryImage = service.images && service.images.length > 0 
    ? service.images[0] 
    : '/images/placeholder-service.jpg'

  const startingPrice = service.startingPrice
  const pricingUnit = service.pricingUnit

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRemoving(true)
    
    try {
      await removeFromCart(uid, service.serviceId)
      onRemove()
    } catch (error) {
      console.error('Error removing from cart:', error)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-pink-200 flex-shrink-0 w-72">
      {/* Image Section */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <Image
          src={primaryImage}
          alt={service.serviceName}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="300px"
        />
        {service.verified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <MdStar className="text-sm" />
            Verified
          </div>
        )}
        
        {/* Remove Button Overlay */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg disabled:opacity-50"
          aria-label="Remove from cart"
        >
          <MdDelete className="text-lg" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Service Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {service.serviceName}
        </h3>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-pink-600">
              {formatPrice(startingPrice)}
            </span>
            <span className="text-sm text-gray-600">
              {formatPricingUnit(pricingUnit as any)}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MdLocationOn className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{service.city}</span>
        </div>

        {/* Quick Info Row */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
          {service.experienceYears && (
            <div className="flex items-center gap-1">
              <MdWorkOutline className="text-gray-400" />
              <span>{service.experienceYears} yrs</span>
            </div>
          )}
          
          {service.serviceType && (
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              {service.serviceType}
            </div>
          )}
        </div>

        {/* Show Details Button */}
        <button
          onClick={onShowDetails}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Show Details
        </button>
      </div>
    </div>
  )
}
