'use client'

import { useState, useEffect } from 'react'
import { MdEventNote, MdCalendarToday, MdLocationOn, MdCategory } from 'react-icons/md'
import { getVendorServices } from '@/lib/firestore-services'
import { getServiceAvailability } from '@/lib/firestore-availability'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import {
  ReservationEntry,
  extractReservationsFromAvailability,
  getUpcomingReservations,
  getMonthsToLoad
} from '@/lib/booking-utils'
import ReservationsModal from '@/components/vendordashboard/bookings/ReservationsModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ServiceWithReservations {
  service: VendorServiceDoc
  upcomingDates: ReservationEntry[]
  totalBookings: number
}

export default function Bookings() {
  const [servicesData, setServicesData] = useState<ServiceWithReservations[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<VendorServiceDoc | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadServicesWithReservations()
  }, [])

  const loadServicesWithReservations = async () => {
    setLoading(true)
    try {
      const vendorId = localStorage.getItem('vendorId')
      if (!vendorId) {
        console.error('Vendor ID not found')
        return
      }

      // Get all vendor services
      const services = await getVendorServices(vendorId)
      
      // For each service, load upcoming bookings
      const servicesWithData: ServiceWithReservations[] = []
      
      for (const service of services) {
        const monthsToLoad = getMonthsToLoad()
        const allReservations: ReservationEntry[] = []

        // Load current and next month only for overview
        for (const yearMonth of monthsToLoad.slice(1)) { // Skip previous month for overview
          const [year, month] = yearMonth.split('-').map(Number)
          const referenceDate = new Date(year, month - 1, 1)
          
          try {
            const availabilityDoc = await getServiceAvailability(service.serviceId, referenceDate)
            
            if (availabilityDoc) {
              const extracted = extractReservationsFromAvailability(
                availabilityDoc,
                service.serviceName,
                service.serviceCategory
              )
              allReservations.push(...extracted)
            }
          } catch (error) {
            // No availability for this month
          }
        }

        const upcomingDates = getUpcomingReservations(
          allReservations.filter(r => r.status === 'booked'),
          3
        )

        servicesWithData.push({
          service,
          upcomingDates,
          totalBookings: allReservations.filter(r => r.status === 'booked').length
        })
      }

      setServicesData(servicesWithData)
    } catch (error) {
      console.error('Error loading services with reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAllReservations = (service: VendorServiceDoc) => {
    setSelectedService(service)
    setModalOpen(true)
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your bookings..." />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">Manage reservations across all your services</p>
      </div>

      {servicesData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <MdEventNote className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No services found</p>
          <p className="text-gray-400 text-sm">Add services to start receiving bookings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.map(({ service, upcomingDates, totalBookings }) => (
            <div key={service.serviceId} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                {/* Service Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.serviceName}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdCategory className="text-purple-600" />
                    <span className="text-sm">{service.serviceCategory}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdLocationOn className="text-red-600" />
                    <span className="text-sm">{service.city}, {service.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MdCalendarToday className="text-green-600" />
                    <span className="text-sm font-semibold">{totalBookings} total booking{totalBookings !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                    📅 Upcoming Bookings
                  </p>
                  {upcomingDates.length === 0 ? (
                    <p className="text-sm text-blue-700">No upcoming bookings</p>
                  ) : (
                    <ul className="space-y-1">
                      {upcomingDates.map((reservation) => (
                        <li key={reservation.dateKey} className="text-sm text-blue-900 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {reservation.dateDisplay}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewAllReservations(service)}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MdEventNote className="text-xl" />
                  Show All Bookings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservations Modal */}
      {modalOpen && selectedService && (
        <ReservationsModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedService(null)
          }}
          service={{
            serviceId: selectedService.serviceId,
            serviceName: selectedService.serviceName,
            serviceCategory: selectedService.serviceCategory,
            city: selectedService.city,
            state: selectedService.state,
            vendorId: selectedService.vendorId,
            cityId: selectedService.cityId
          }}
        />
      )}
    </div>
  )
}
