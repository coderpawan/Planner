'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { MdChevronLeft, MdChevronRight, MdEvent, MdArrowBack } from 'react-icons/md'
import DateModal from '@/components/vendordashboard/services/DateModal'
import { getServiceAvailability } from '@/lib/firestore-availability'
import { getVendorService, getCategoryIds } from '@/lib/firestore-services'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  VendorServiceDoc, 
  ServiceAvailabilityDoc, 
  normalizeCityId, 
  formatDateKey 
} from '@/lib/firestore-utils'

interface Service {
  id: string
  serviceName: string
  serviceCategory: string
  cityId: string
  city: string
  vendorId: string
}

export default function AdminServiceCalendar({ params }: { params: { serviceId: string } }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availabilityDoc, setAvailabilityDoc] = useState<ServiceAvailabilityDoc | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendorId')

  const { serviceId } = params

  useEffect(() => {
    fetchServiceAndAvailability()
  }, [serviceId, currentDate, refreshTrigger, vendorId])

  const fetchServiceAndAvailability = async () => {
    setLoading(true)
    try {
      if (!vendorId) {
        console.error('Vendor ID not found in URL params')
        return
      }

      // Get vendor profile to find cities
      const vendorDoc = await getDoc(doc(firestore, 'VerifiedVendors', vendorId))
      if (!vendorDoc.exists()) {
        console.error('Vendor not found')
        return
      }

      const vendorData = vendorDoc.data()
      const cities = vendorData.cities || []

      // Try to find the service across all cities and categories
      let foundService: VendorServiceDoc | null = null
      
      // Fetch category IDs dynamically from Firestore
      const categoryIds = await getCategoryIds()

      for (const cityObj of cities) {
        const cityId = normalizeCityId(cityObj.city)
        for (const categoryId of categoryIds) {
          try {
            const serviceData = await getVendorService(cityId, categoryId, serviceId)
            if (serviceData) {
              foundService = serviceData
              break
            }
          } catch (error) {
            // Continue searching
          }
        }
        if (foundService) break
      }

      if (!foundService) {
        console.error('Service not found')
        return
      }

      setService({
        id: foundService.serviceId,
        serviceName: foundService.serviceName,
        serviceCategory: foundService.serviceCategory,
        cityId: foundService.cityId,
        city: foundService.city,
        vendorId: foundService.vendorId
      })

      // Fetch availability document for current month
      const availabilityData = await getServiceAvailability(serviceId, currentDate)
      setAvailabilityDoc(availabilityData)
    } catch (error) {
      console.error('Error fetching service and availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    setSelectedDate(dateKey)
    setModalOpen(true)
  }

  const getDateStatus = (day: number) => {
    if (!availabilityDoc) return 'available'
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    const dayData = availabilityDoc.calendar[dateKey]
    return dayData?.status || 'available'
  }

  const hasEvents = (day: number) => {
    if (!availabilityDoc) return false
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    const dayData = availabilityDoc.calendar[dateKey]
    return dayData?.events && dayData.events.length > 0
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Service not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <MdArrowBack className="text-2xl text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.serviceName}</h1>
            <p className="text-gray-600 mt-1">{service.city} • {service.serviceCategory}</p>
            <p className="text-sm text-gray-500 mt-1">Admin Mode - Managing Vendor Calendar</p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdChevronLeft className="text-2xl text-gray-700" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {monthName} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdChevronRight className="text-2xl text-gray-700" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const status = getDateStatus(day)
              const hasEventsFlag = hasEvents(day)
              const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0))

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded-lg border-2 p-2 transition-all hover:shadow-md relative ${
                    status === 'blocked'
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : status === 'booked'
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : isPast
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-pink-400'
                  }`}
                >
                  <span className="font-semibold">{day}</span>
                  {hasEventsFlag && (
                    <MdEvent className="absolute bottom-1 right-1 text-purple-600 text-sm" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border-2 border-red-400 rounded"></div>
              <span className="text-sm text-gray-600">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded"></div>
              <span className="text-sm text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Past</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Modal */}
      {modalOpen && selectedDate && service && (
        <DateModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedDate(null)
          }}
          date={selectedDate}
          serviceId={serviceId}
          service={{
            vendorId: service.vendorId,
            cityId: service.cityId,
            serviceCategory: service.serviceCategory
          }}
          onUpdate={() => {
            setRefreshTrigger(prev => prev + 1)
          }}
          mode="admin"
        />
      )}
    </div>
  )
}
