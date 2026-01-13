'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { MdChevronLeft, MdChevronRight, MdEvent } from 'react-icons/md'
import DateModal from '@/components/vendordashboard/services/DateModal'
import { getServiceAvailability } from '@/lib/firestore-availability'
import { getVendorService, getCategoryIds } from '@/lib/firestore-services'
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

export default function ServiceCalendar({ params }: { params: { serviceId: string } }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availabilityDoc, setAvailabilityDoc] = useState<ServiceAvailabilityDoc | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { serviceId } = params

  useEffect(() => {
    fetchServiceAndAvailability()
  }, [serviceId, currentDate, refreshTrigger])

  const fetchServiceAndAvailability = async () => {
    setLoading(true)
    try {
      // First, we need to find the service to get cityId and category
      // We'll query from localStorage vendorId
      const vendorId = localStorage.getItem('vendorId')
      if (!vendorId) {
        console.error('Vendor ID not found')
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
      const availability = await getServiceAvailability(serviceId, currentDate)
      setAvailabilityDoc(availability)

    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date): string => {
    return formatDateKey(date)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getDateStatus = (date: Date): 'available' | 'blocked' | 'booked' => {
    if (!availabilityDoc) {
      return 'available' // No availability doc means all dates are available
    }

    const dateStr = formatDate(date)
    const dayData = availabilityDoc.calendar[dateStr]
    
    // If date key doesn't exist in calendar MAP, it's available
    if (!dayData) {
      return 'available'
    }

    return dayData.status
  }

  const hasEvents = (date: Date): boolean => {
    if (!availabilityDoc) {
      return false
    }

    const dateStr = formatDate(date)
    const dayData = availabilityDoc.calendar[dateStr]
    
    return dayData && dayData.events && dayData.events.length > 0
  }

  const handleDateClick = (date: Date) => {
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dateStr = formatDate(clickedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Prevent selecting past dates
    if (clickedDate < today) {
      return
    }

    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      available: 'bg-green-100 text-green-700 border-green-300',
      blocked: 'bg-gray-200 text-gray-600 border-gray-400',
      booked: 'bg-red-100 text-red-700 border-red-300'
    }
    
    return colorMap[status as keyof typeof colorMap] || colorMap.available
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  const days = getDaysInMonth()
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{service?.serviceName || 'Service Calendar'}</h1>
        <p className="text-gray-600 mt-2">Manage availability and events for {service?.serviceCategory}</p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MdChevronLeft className="text-2xl" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{monthYear}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MdChevronRight className="text-2xl" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const status = getDateStatus(date)
            const hasEvent = hasEvents(date)
            const isToday = formatDate(date) === formatDate(new Date())
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

            return (
              <button
                key={dateKey}
                onClick={() => !isPast && handleDateClick(date)}
                disabled={isPast}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center font-semibold transition-all relative ${
                  getStatusColor(status)
                } ${isToday ? 'ring-2 ring-pink-500' : ''} ${
                  isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className="text-base">{date.getDate()}</span>
                {hasEvent && (
                  <MdEvent className="absolute bottom-1 right-1 text-purple-600 text-xs" />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded"></div>
            <span className="text-sm text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <MdEvent className="text-purple-600 text-base" />
            <span className="text-sm text-gray-600">Has Events</span>
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
          service={service}
          onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          mode="vendor"
        />
      )}
    </div>
  )
}
