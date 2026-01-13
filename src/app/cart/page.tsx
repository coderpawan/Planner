'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cartUtils'
import { getServiceByIdCityCategory, getCategoryLabelsMap } from '@/lib/firestore-services'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import CartServiceCard from '@/components/cart/CartServiceCard'
import ServiceDetailModal from '@/components/budget/ServiceDetailModal'
import PhoneAuthModal from '@/components/auth/PhoneAuthModal'
import { MdShoppingCart } from 'react-icons/md'

interface GroupedServices {
  [category: string]: VendorServiceDoc[]
}

export default function CartPage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)
  const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false)
  const [groupedServices, setGroupedServices] = useState<GroupedServices>({})
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [selectedService, setSelectedService] = useState<VendorServiceDoc | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({})
  
  const { cart, isLoading: isLoadingCart, refreshCart } = useCart(uid)

  // Fetch category labels on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const labels = await getCategoryLabelsMap()
      setCategoryLabels(labels)
    }
    
    fetchCategories()
  }, [])

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('uid')
      
      if (!storedUid) {
        // Not logged in - show auth modal
        setShowPhoneAuthModal(true)
      } else {
        setUid(storedUid)
      }
      
      // Mark auth check as complete
      setAuthCheckComplete(true)
    }
  }, [])

  // Fetch services when cart changes
  useEffect(() => {
    if (!uid || isLoadingCart) return

    const fetchCartServices = async () => {
      setIsLoadingServices(true)
      const grouped: GroupedServices = {}

      try {
        // Fetch each service from cart using direct path (more efficient)
        const servicePromises = Object.keys(cart).map(async (serviceId) => {
          const cartItem = cart[serviceId]
          const service = await getServiceByIdCityCategory(
            serviceId,
            cartItem.city,
            cartItem.category
          )
          
          // Only add service if it exists AND is active
          if (service && service.active) {
            const category = cartItem.category
            if (!grouped[category]) {
              grouped[category] = []
            }
            grouped[category].push(service)
          }
        })

        await Promise.all(servicePromises)
        setGroupedServices(grouped)
      } catch (error) {
        console.error('Error fetching cart services:', error)
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchCartServices()
  }, [cart, uid, isLoadingCart])

  const handleAuthSuccess = () => {
    setShowPhoneAuthModal(false)
    window.location.reload()
  }

  const handleShowDetails = (service: VendorServiceDoc) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleRemoveFromCart = async () => {
    // Refresh cart after removal
    await refreshCart()
  }

  // Redirect to home if not authenticated and modal is closed
  // Only check after initial auth check is complete
  useEffect(() => {
    if (!authCheckComplete) {
      return
    }
    
    if (!uid && !showPhoneAuthModal) {
      router.push('/')
    }
  }, [uid, showPhoneAuthModal, authCheckComplete, router])

  if (isLoadingCart || isLoadingServices) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Count only active services (those in groupedServices)
  const cartItemCount = Object.values(groupedServices).reduce((total, services) => total + services.length, 0)
  const categoryCount = Object.keys(groupedServices).length

  return (
    <>
      <div className="min-h-screen bg-[#FFF8F0] py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <MdShoppingCart className="text-pink-500" />
              Your Cart
            </h1>
            <p className="text-gray-600">
              {cartItemCount === 0 
                ? 'Your cart is empty' 
                : `${cartItemCount} service${cartItemCount !== 1 ? 's' : ''} in ${categoryCount} categor${categoryCount !== 1 ? 'ies' : 'y'}`
              }
            </p>
          </div>

          {/* Empty Cart State */}
          {cartItemCount === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-pink-100 rounded-full mb-6">
                <MdShoppingCart className="text-5xl text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Discover amazing wedding services and add them to your cart to get started with planning your dream wedding.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Services
              </button>
            </div>
          ) : (
            /* Category-wise Service Display */
            <div className="space-y-8">
              {Object.entries(groupedServices).map(([category, services]) => (
                <div key={category} className="bg-white rounded-2xl shadow-lg p-6">
                  {/* Category Header */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {categoryLabels[category] || category}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {services.length} service{services.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Horizontal Scroll Container */}
                  <div className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                      {services.map((service) => (
                        <CartServiceCard
                          key={service.serviceId}
                          service={service}
                          onShowDetails={() => handleShowDetails(service)}
                          onRemove={handleRemoveFromCart}
                          uid={uid!}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedService(null)
          }}
        />
      )}

      {/* Phone Auth Modal */}
      <PhoneAuthModal
        isOpen={showPhoneAuthModal}
        onClose={() => {
          setShowPhoneAuthModal(false)
          router.push('/')
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
