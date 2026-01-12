'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MdEventNote, MdCalendarToday, MdBlock, MdTrendingUp, MdArrowForward, MdPersonAdd } from 'react-icons/md'
import { getVendorServices } from '@/lib/firestore-services'
import { getServiceAvailability } from '@/lib/firestore-availability'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import { 
  ReservationEntry, 
  extractReservationsFromAvailability,
  getMonthsToLoad,
} from '@/lib/booking-utils'
import { getVendorEngagements } from '@/lib/firestore-engagements'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface DashboardStats {
  upcomingBookings: number
  monthlyBookings: number
  activeServices: number
  blockedDates: number
  totalLeads: number
}

interface UpcomingBooking {
  date: Date
  dateDisplay: string
  serviceName: string
  eventTitle: string
}

interface ServiceOverview {
  serviceId: string
  serviceName: string
  category: string
  city: string
  nextBookingDate: string | null
}

export default function VendorDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    upcomingBookings: 0,
    monthlyBookings: 0,
    activeServices: 0,
    blockedDates: 0,
    totalLeads: 0
  })
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [servicesOverview, setServicesOverview] = useState<ServiceOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const vendorId = localStorage.getItem('vendorId')
      if (!vendorId) {
        console.error('Vendor ID not found')
        return
      }

      // Get all vendor services
      const services = await getVendorServices(vendorId)
      
      if (services.length === 0) {
        setLoading(false)
        return
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      const sevenDaysFromNow = new Date(now)
      sevenDaysFromNow.setDate(now.getDate() + 7)
      
      const thirtyDaysFromNow = new Date(now)
      thirtyDaysFromNow.setDate(now.getDate() + 30)
      
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      let totalUpcomingBookings = 0
      let totalMonthlyBookings = 0
      let totalBlockedDates = 0
      const allUpcomingBookings: UpcomingBooking[] = []
      const serviceOverviews: ServiceOverview[] = []

      // Process each service
      for (const service of services) {
        const monthsToLoad = getMonthsToLoad()
        const allReservations: ReservationEntry[] = []

        // Load availability data
        for (const yearMonth of monthsToLoad) {
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

        // Calculate stats
        const bookedReservations = allReservations.filter(r => r.status === 'booked')
        const blockedReservations = allReservations.filter(r => r.status === 'blocked')

        // Upcoming bookings (next 7 days)
        const upcomingInSevenDays = bookedReservations.filter(
          r => r.dateObj >= now && r.dateObj <= sevenDaysFromNow
        )
        totalUpcomingBookings += upcomingInSevenDays.length

        // Monthly bookings
        const monthlyBookedCount = bookedReservations.filter(
          r => r.dateObj.getMonth() === currentMonth && r.dateObj.getFullYear() === currentYear
        ).length
        totalMonthlyBookings += monthlyBookedCount

        // Blocked dates (next 30 days)
        const blockedInThirtyDays = blockedReservations.filter(
          r => r.dateObj >= now && r.dateObj <= thirtyDaysFromNow
        )
        totalBlockedDates += blockedInThirtyDays.length

        // Collect upcoming bookings for list
        upcomingInSevenDays.forEach(reservation => {
          reservation.events.forEach(event => {
            allUpcomingBookings.push({
              date: reservation.dateObj,
              dateDisplay: reservation.dateDisplay,
              serviceName: service.serviceName,
              eventTitle: event.title
            })
          })
        })

        // Find next booking for service overview
        const futureBookings = bookedReservations
          .filter(r => r.dateObj >= now)
          .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        
        serviceOverviews.push({
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          category: service.serviceCategory,
          city: service.city,
          nextBookingDate: futureBookings.length > 0 ? futureBookings[0].dateDisplay : null
        })
      }

      // Sort and limit upcoming bookings
      allUpcomingBookings.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Get engagement count
      const engagements = await getVendorEngagements(vendorId)
      
      setStats({
        upcomingBookings: totalUpcomingBookings,
        monthlyBookings: totalMonthlyBookings,
        activeServices: services.length,
        blockedDates: totalBlockedDates,
        totalLeads: engagements.length
      })
      
      setUpcomingBookings(allUpcomingBookings.slice(0, 5))
      setServicesOverview(serviceOverviews.slice(0, 4))
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your dashboard..." />
  }

  // Empty state - no services
  if (stats.activeServices === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to your vendor dashboard</p>
        
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <MdEventNote className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h2>
          <p className="text-gray-600 mb-6">Create your first service to start receiving bookings</p>
          <button
            onClick={() => router.push('/vendordashboard/services')}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            Add Your First Service
            <MdArrowForward className="text-xl" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">Your business at a glance</p>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Next 7 Days</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.upcomingBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Upcoming</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MdCalendarToday className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.monthlyBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Bookings</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MdTrendingUp className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeServices}</p>
              <p className="text-xs text-gray-500 mt-1">Services</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MdEventNote className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/vendordashboard/engagements')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">Leads</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <MdPersonAdd className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Upcoming Bookings</h2>
          </div>
          
          <div className="p-6">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <MdCalendarToday className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming bookings. You're all clear.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {upcomingBookings.map((booking, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-xs text-gray-500 uppercase">
                          {booking.date.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {booking.date.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{booking.eventTitle}</p>
                        <p className="text-sm text-gray-600 truncate">{booking.serviceName}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => router.push('/vendordashboard/bookings')}
                  className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  View All Bookings
                  <MdArrowForward className="text-lg" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Services Quick Overview */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">My Services Overview</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-3 mb-4">
              {servicesOverview.map((service) => (
                <div key={service.serviceId} className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{service.serviceName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                          {service.category}
                        </span>
                        <span className="text-xs text-gray-500">{service.city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {service.nextBookingDate ? (
                      <span className="text-green-600 font-medium">Next: {service.nextBookingDate}</span>
                    ) : (
                      <span className="text-gray-400 italic">No bookings yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => router.push('/vendordashboard/services')}
              className="w-full py-2.5 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 border border-purple-200"
            >
              View All Services
              <MdArrowForward className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
