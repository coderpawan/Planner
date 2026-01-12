'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MdCalendarToday, MdLocationOn, MdCategory, MdAdd, MdEdit, MdDelete, MdEventNote, MdToggleOn, MdToggleOff } from 'react-icons/md'
import AddServiceModal from '@/components/vendordashboard/services/AddServiceModal'
import EditServiceModal from '@/components/vendordashboard/services/EditServiceModal'
import DeleteServiceModal from '@/components/vendordashboard/services/DeleteServiceModal'
import { getVendorServices, updateServiceActiveStatus } from '@/lib/firestore-services'
import { VendorServiceDoc } from '@/lib/firestore-utils'

interface ServiceManagerProps {
  vendorId: string
  mode?: 'admin' | 'vendor'
}

const CATEGORY_LABELS: Record<string, string> = {
  venue: "Venues & Wedding Spaces",
  catering: "Catering & Food Services",
  decor: "Wedding Decor & Styling",
  photography: "Photography & Videography",
  makeup_styling: "Makeup, Mehendi & Styling",
  music_entertainment: "Music, DJ & Entertainment",
  choreography: "Choreography & Performances",
  ritual_services: "Pandit, Priest & Ritual Services",
  wedding_transport: "Wedding Transport & Baraat Services",
  invitations_gifting: "Invitations, Gifts & Packaging",
  wedding_planner: "Wedding Planning & Coordination"
}

const PRICING_UNIT_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_day: 'Per Day',
  per_event: 'Per Event',
  per_plate: 'Per Plate',
  per_hour: 'Per Hour'
}

export default function ServiceManager({ vendorId, mode = 'vendor' }: ServiceManagerProps) {
  const [services, setServices] = useState<VendorServiceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [showEditServiceModal, setShowEditServiceModal] = useState(false)
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false)
  const [selectedService, setSelectedService] = useState<VendorServiceDoc | null>(null)
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (vendorId) {
      fetchServices()
    }
  }, [vendorId])

  const fetchServices = async () => {
    try {
      console.log('Fetching services for vendor:', vendorId)
      const servicesList = await getVendorServices(vendorId)
      console.log('Services retrieved:', servicesList.length)
      setServices(servicesList)
    } catch (error) {
      console.error('Error fetching services:', error)
      alert('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleEditService = (service: VendorServiceDoc) => {
    setSelectedService(service)
    setShowEditServiceModal(true)
  }

  const handleDeleteService = (service: VendorServiceDoc) => {
    setSelectedService(service)
    setShowDeleteServiceModal(true)
  }

  const handleCalendarClick = (serviceId: string) => {
    if (mode === 'admin') {
      // For admin, use a different route or pass vendorId
      router.push(`/admin/manage-services/${serviceId}/calendar?vendorId=${vendorId}`)
    } else {
      router.push(`/vendordashboard/services/${serviceId}/calendar`)
    }
  }

  const handleToggleActive = async (service: VendorServiceDoc) => {
    try {
      setTogglingServiceId(service.serviceId)
      
      const newActiveStatus = !service.active
      
      // Update Firestore
      await updateServiceActiveStatus(
        service.cityId,
        service.serviceCategory,
        service.serviceId,
        newActiveStatus
      )
      
      // Optimistically update UI
      setServices(prevServices => 
        prevServices.map(s => 
          s.serviceId === service.serviceId 
            ? { ...s, active: newActiveStatus }
            : s
        )
      )
      
      // Show success message
      const message = newActiveStatus 
        ? '✓ Service activated successfully' 
        : '✓ Service deactivated successfully'
      alert(message)
      
    } catch (error) {
      console.error('Error toggling service status:', error)
      alert('Failed to update service status. Please try again.')
    } finally {
      setTogglingServiceId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'admin' ? 'Vendor Services' : 'My Services'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'admin' ? 'Manage vendor services and availability' : 'Manage your services and availability'}
          </p>
        </div>
        <button
          onClick={() => setShowAddServiceModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <MdAdd className="text-xl" />
          Add New Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="mb-4">
            <MdEventNote className="text-6xl text-gray-300 mx-auto" />
          </div>
          <p className="text-gray-500 text-lg mb-4">No active services found</p>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <MdAdd className="text-xl" />
            Add First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const isToggling = togglingServiceId === service.serviceId
            const isInactive = !service.active
            
            return (
              <div 
                key={service.serviceId} 
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow ${
                  isInactive ? 'opacity-60' : ''
                }`}
              >
                <div className="p-6">
                  {/* Service header with status badge */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{service.serviceName}</h3>
                    {isInactive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdCategory className="text-purple-600" />
                    <span className="text-sm">
                      {CATEGORY_LABELS[service.serviceCategory as keyof typeof CATEGORY_LABELS] || service.serviceCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdLocationOn className="text-red-600" />
                    <span className="text-sm">{service.city}, {service.state}</span>
                  </div>
                  <div className="text-gray-900 font-semibold text-lg">
                    ₹{service.startingPrice?.toLocaleString('en-IN') || '0'}
                    {service.pricingUnit && (
                      <span className="text-sm text-gray-600 font-normal ml-1">
                        {PRICING_UNIT_LABELS[service.pricingUnit as keyof typeof PRICING_UNIT_LABELS] || service.pricingUnit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  {/* Toggle Active/Inactive Button */}
                  <button
                    onClick={() => handleToggleActive(service)}
                    disabled={isToggling}
                    className={`w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      isInactive
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isToggling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {isInactive ? (
                          <>
                            <MdToggleOff className="text-xl" />
                            Activate
                          </>
                        ) : (
                          <>
                            <MdToggleOn className="text-xl" />
                            Deactivate
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {/* Other action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCalendarClick(service.serviceId)}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      disabled={isToggling}
                    >
                      <MdCalendarToday className="text-xl" />
                      Calendar
                    </button>
                    <button
                      onClick={() => handleEditService(service)}
                      className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center"
                      title="Edit Service"
                      disabled={isToggling}
                    >
                      <MdEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service)}
                      className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center"
                      title="Delete Service"
                      disabled={isToggling}
                    >
                      <MdDelete className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <AddServiceModal
          isOpen={showAddServiceModal}
          onClose={() => setShowAddServiceModal(false)}
          onSuccess={() => {
            setShowAddServiceModal(false)
            fetchServices()
          }}
          vendorId={vendorId}
          mode={mode}
        />
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && selectedService && (
        <EditServiceModal
          isOpen={showEditServiceModal}
          onClose={() => {
            setShowEditServiceModal(false)
            setSelectedService(null)
          }}
          service={selectedService}
          onSuccess={() => {
            setShowEditServiceModal(false)
            setSelectedService(null)
            fetchServices()
          }}
          mode={mode}
        />
      )}

      {/* Delete Service Modal */}
      {showDeleteServiceModal && selectedService && (
        <DeleteServiceModal
          isOpen={showDeleteServiceModal}
          onClose={() => {
            setShowDeleteServiceModal(false)
            setSelectedService(null)
          }}
          service={selectedService}
          onSuccess={() => {
            setShowDeleteServiceModal(false)
            setSelectedService(null)
            fetchServices()
          }}
          mode={mode}
        />
      )}
    </div>
  )
}
