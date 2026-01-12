'use client'

import { useEffect, useState } from 'react'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import { formatPrice, formatPricingUnit } from '@/config/weddingBudgetConfig'
import ImageCarousel from './ImageCarousel'
import FullscreenImageViewer from './FullscreenImageViewer'
import BuyCreditsModal from '@/components/common/BuyCreditsModal'
import PhoneAuthModal from '@/components/auth/PhoneAuthModal'
import { useCredits } from '@/contexts/CreditContext'
import { canViewContact, deductCredit, isServiceUnlocked } from '@/lib/creditUtils'
import { addToCart, removeFromCart, useIsInCart } from '@/lib/cartUtils'
import {
  MdClose,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdMap,
  MdStar,
  MdVerified,
  MdWorkOutline,
  MdPeople,
  MdRestaurant,
  MdCamera,
  MdTheaters,
  MdLock,
  MdShoppingCart,
  MdCheckCircle
} from 'react-icons/md'

interface ServiceDetailModalProps {
  service: VendorServiceDoc
  isOpen: boolean
  onClose: () => void
}

export default function ServiceDetailModal({ service, isOpen, onClose }: ServiceDetailModalProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isContactUnlocked, setIsContactUnlocked] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)
  const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false)
  const [message, setMessage] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const { credits, unlockedServices, refreshCredits } = useCredits()
  const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
  const { inCart, refreshStatus } = useIsInCart(uid, service.serviceId)

  useEffect(() => {
    if (!isOpen) return

    // Check if contact is unlocked for this service
    const checkUnlockStatus = async () => {
      if (!uid) {
        setIsContactUnlocked(false)
        return
      }

      // Only Admin has unlimited access
      if (role === 'Admin') {
        setIsContactUnlocked(true)
        return
      }

      // Check if already unlocked
      const unlocked = unlockedServices.includes(service.serviceId)
      setIsContactUnlocked(unlocked)
    }

    checkUnlockStatus()

    // Lock body scroll
    document.body.style.overflow = 'hidden'

    // ESC key handler
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreenOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, isFullscreenOpen, onClose, uid, role, service.serviceId, unlockedServices])

  if (!isOpen) return null

  const handleUnlockContact = async () => {
    // Not logged in - show auth modal
    if (!uid) {
      setShowPhoneAuthModal(true)
      return
    }

    // Admin - instant access
    if (role === 'Admin') {
      setIsContactUnlocked(true)
      return
    }

    // No credits - show buy credits modal
    if (credits <= 0) {
      setShowBuyCreditsModal(true)
      return
    }

    // Has credits - deduct and unlock
    setIsUnlocking(true)
    setMessage('')

    try {
      // Get user details from localStorage
      const userName = typeof window !== 'undefined' ? localStorage.getItem('name') : null
      const userPhone = typeof window !== 'undefined' ? localStorage.getItem('phoneNumber') : null
      
      const result = await deductCredit(
        uid, 
        service.serviceId,
        service,  // Pass service object for engagement logging
        userName || undefined,
        userPhone || undefined,
        role || undefined
      )
      
      if (result.success) {
        setIsContactUnlocked(true)
        setMessage('✓ 1 credit used')
        await refreshCredits()
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(result.message)
        if (result.message === 'Not enough credits') {
          setShowBuyCreditsModal(true)
        }
      }
    } catch (error) {
      setMessage('Failed to unlock contact. Please try again.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleAuthSuccess = () => {
    setShowPhoneAuthModal(false)
    // Refresh the page to load user data
    window.location.reload()
  }

  const handleAddToCart = async () => {
    // Not logged in - show auth modal
    if (!uid) {
      setShowPhoneAuthModal(true)
      return
    }

    setIsAddingToCart(true)
    setCartMessage('')

    try {
      const result = await addToCart(uid, service.serviceId, service.serviceCategory, service.city)
      
      if (result.success) {
        setCartMessage('✓ Added to cart')
        await refreshStatus()
        
        // Clear message after 3 seconds
        setTimeout(() => setCartMessage(''), 3000)
      } else {
        setCartMessage(result.message)
      }
    } catch (error) {
      setCartMessage('Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsFullscreenOpen(true)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 pr-8">Service Details</h2>
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Image Carousel */}
            {service.images && service.images.length > 0 && (
              <ImageCarousel
                images={service.images}
                alt={service.serviceName}
                onImageClick={handleImageClick}
              />
            )}

            {/* Service Information */}
            <div className="p-6 space-y-6">
              {/* Title and Verification */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-3xl font-bold text-gray-900">{service.serviceName}</h3>
                  {service.verified && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                      <MdVerified className="text-lg" />
                      Verified
                    </div>
                  )}
                </div>
                
                {/* Category Badge */}
                <div className="inline-block bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                  {service.serviceCategory.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Starting from</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-pink-600">
                    {formatPrice(service.startingPrice)}
                  </span>
                  <span className="text-lg text-gray-700">
                    {formatPricingUnit(service.pricingUnit as any)}
                  </span>
                </div>
                {service.priceMax && service.priceMax > service.startingPrice && (
                  <p className="text-sm text-gray-600 mt-2">
                    Up to {formatPrice(service.priceMax)}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {service.experienceYears && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <MdWorkOutline className="text-2xl text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{service.experienceYears}</p>
                    <p className="text-sm text-gray-600">Years Exp.</p>
                  </div>
                )}
                
                {service.capacity && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <MdPeople className="text-2xl text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{service.capacity}</p>
                    <p className="text-sm text-gray-600">Capacity</p>
                  </div>
                )}
                
                {service.serviceType && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <MdTheaters className="text-2xl text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">{service.serviceType}</p>
                    <p className="text-xs text-gray-600">Service Type</p>
                  </div>
                )}
                
                {service.vegNonVeg && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <MdRestaurant className="text-2xl text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">{service.vegNonVeg}</p>
                    <p className="text-xs text-gray-600">Food Type</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {service.description && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">About This Service</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {service.description}
                  </p>
                </div>
              )}

              {/* Highlights */}
              {service.highlights && service.highlights.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Key Highlights</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-pink-500 text-xl mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category-Specific Fields */}
              {service.cuisines && service.cuisines.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Cuisines Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.cuisines.map((cuisine, idx) => (
                      <span key={idx} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {service.planningTypes && service.planningTypes.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Planning Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.planningTypes.map((type, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {service.equipment && service.equipment.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Equipment Available</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.equipment.map((item, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {service.packages && service.packages.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Available Packages</h4>
                  <div className="space-y-3">
                    {service.packages.map((pkg, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-900">{pkg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || inCart}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    inCart
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {inCart ? (
                    <>
                      <MdCheckCircle className="text-2xl" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <MdShoppingCart className="text-2xl" />
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </>
                  )}
                </button>
                {cartMessage && (
                  <p className={`mt-3 text-sm text-center ${cartMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {cartMessage}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h4>
                
                {!isContactUnlocked ? (
                  // LOCKED STATE - Show unlock button
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                      <MdLock className="text-3xl text-pink-600" />
                    </div>
                    <p className="text-gray-700 mb-6">
                      Unlock contact details to connect with this vendor
                    </p>
                    
                    <button
                      onClick={handleUnlockContact}
                      disabled={isUnlocking}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUnlocking ? 'Unlocking...' : uid ? 'View Contact Details (Use 1 Credit)' : 'Login to View Contact Details'}
                    </button>
                    
                    {message && (
                      <p className={`mt-4 text-sm ${message.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                      </p>
                    )}
                  </div>
                ) : (
                  // UNLOCKED STATE - Show contact details
                  <div className="space-y-3">
                    {service.ownerName && (
                      <div className="flex items-center gap-3">
                        <MdStar className="text-xl text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Owner</p>
                          <p className="font-semibold text-gray-900">{service.ownerName}</p>
                        </div>
                      </div>
                    )}

                    {service.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <MdPhone className="text-xl text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <a 
                            href={`tel:${service.phoneNumber}`}
                            className="font-semibold text-pink-600 hover:text-pink-700"
                          >
                            {service.phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}

                    {service.alternativePhoneNumber && (
                      <div className="flex items-center gap-3">
                        <MdPhone className="text-xl text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Alternative Phone</p>
                          <a 
                            href={`tel:${service.alternativePhoneNumber}`}
                            className="font-semibold text-pink-600 hover:text-pink-700"
                          >
                            {service.alternativePhoneNumber}
                          </a>
                        </div>
                      </div>
                    )}

                    {service.address && (
                      <div className="flex items-start gap-3">
                        <MdLocationOn className="text-xl text-gray-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-semibold text-gray-900">{service.address}</p>
                          <p className="text-sm text-gray-600">{service.city}, {service.state}</p>
                        </div>
                      </div>
                    )}

                    {service.googleMapLink && (
                      <div className="flex items-center gap-3">
                        <MdMap className="text-xl text-gray-600 flex-shrink-0" />
                        <a
                          href={service.googleMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-pink-600 hover:text-pink-700 hover:underline"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Buttons - Only show if unlocked */}
              {isContactUnlocked && (
                <div className="flex gap-4 pt-4">
                  <a
                    href={`tel:${service.phoneNumber}`}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    📞 Call Now
                  </a>
                  <a
                    href={`https://wa.me/${service.phoneNumber?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        images={service.images || []}
        initialIndex={selectedImageIndex}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        alt={service.serviceName}
      />
      
      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
      />
      
      {/* Phone Auth Modal */}
      <PhoneAuthModal
        isOpen={showPhoneAuthModal}
        onClose={() => setShowPhoneAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
