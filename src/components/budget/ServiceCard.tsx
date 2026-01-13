'use client'

import { useState } from 'react'
import Image from 'next/image'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import { formatPrice, formatPricingUnit } from '@/config/weddingBudgetConfig'
import { MdStar, MdLocationOn, MdWorkOutline, MdPeople } from 'react-icons/md'
import { addToCart, useIsInCart } from '@/lib/cartUtils'
import PhoneAuthModal from '@/components/auth/PhoneAuthModal'

interface ServiceCardProps {
  service: VendorServiceDoc
  onClick: () => void
}

export default function ServiceCard({ service, onClick }: ServiceCardProps) {
  const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
  const { inCart } = useIsInCart(uid, service.serviceId)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false)

  const primaryImage = service.images && service.images.length > 0 
    ? service.images[0] 
    : '/images/placeholder-service.jpg'

  const startingPrice = service.startingPrice
  const pricingUnit = service.pricingUnit

  // Get up to 4 highlights
  const highlights = service.highlights?.slice(0, 4) || []

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!uid) {
      setShowPhoneAuthModal(true)
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(uid, service.serviceId, service.serviceCategory, service.city)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAuthSuccess = () => {
    setShowPhoneAuthModal(false)
    // No need to reload - user data is now in localStorage
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only call onClick if the click wasn't on a button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    onClick()
  }

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-pink-200 hover:scale-[1.02]"
      >
      {/* Image Section */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <Image
          src={primaryImage}
          alt={service.serviceName}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {service.verified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <MdStar className="text-sm" />
            Verified
          </div>
        )}
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
          
          {service.capacity && (
            <div className="flex items-center gap-1">
              <MdPeople className="text-gray-400" />
              <span>{service.capacity}</span>
            </div>
          )}
          
          {service.serviceType && (
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              {service.serviceType}
            </div>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-1.5">
              {highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-pink-500 mt-1 flex-shrink-0">✓</span>
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || inCart}
            className={`px-4 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              inCart
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-white text-pink-600 border-2 border-pink-600 hover:bg-pink-50'
            }`}
          >
            {inCart ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                In Cart
              </span>
            ) : isAddingToCart ? (
              'Adding...'
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cart
              </span>
            )}
          </button>
          <button
            onClick={onClick}
            className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg"
          >
            <span>Show Details</span>
            <svg 
              className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

      <PhoneAuthModal
        isOpen={showPhoneAuthModal}
        onClose={() => setShowPhoneAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
