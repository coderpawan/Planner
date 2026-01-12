'use client'

import { useState, useEffect, useMemo } from 'react'
import { MdClose, MdExpandMore, MdExpandLess, MdFilterList, MdRefresh } from 'react-icons/md'
import { getServiceAvailability } from '@/lib/firestore-availability'
import { getAvailabilityDocId } from '@/lib/firestore-utils'
import {
  ReservationEntry,
  extractReservationsFromAvailability,
  sortReservations,
  filterByMonthYear,
  filterByDateRange,
  getMonthsToLoad,
  extractUniqueYears,
  MONTH_NAMES
} from '@/lib/booking-utils'

interface ReservationsModalProps {
  isOpen: boolean
  onClose: () => void
  service: {
    serviceId: string
    serviceName: string
    serviceCategory: string
    city: string
    state: string
    vendorId: string
    cityId: string
  }
}

export default function ReservationsModal({ isOpen, onClose, service }: ReservationsModalProps) {
  const [reservations, setReservations] = useState<ReservationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadReservationData()
    }
  }, [isOpen, service.serviceId])

  const loadReservationData = async () => {
    setLoading(true)
    try {
      const monthsToLoad = getMonthsToLoad()
      const allReservations: ReservationEntry[] = []

      // Load 3 months (previous, current, next)
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
          console.log(`No availability for ${yearMonth}`)
        }
      }

      setReservations(sortReservations(allReservations, true))
    } catch (error) {
      console.error('Error loading reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReservations = useMemo(() => {
    let filtered = [...reservations]

    // Filter by month/year
    if (selectedMonth !== undefined || selectedYear !== undefined) {
      filtered = filterByMonthYear(filtered, selectedMonth, selectedYear)
    }

    // Filter by date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      filtered = filterByDateRange(filtered, start, end)
    }

    return filtered
  }, [reservations, selectedMonth, selectedYear, startDate, endDate])

  const uniqueYears = useMemo(() => extractUniqueYears(reservations), [reservations])

  const toggleRowExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedRows(newExpanded)
  }

  const resetFilters = () => {
    setSelectedMonth(undefined)
    setSelectedYear(undefined)
    setStartDate('')
    setEndDate('')
  }

  const getStatusColor = (status: 'booked' | 'blocked') => {
    return status === 'booked' 
      ? 'bg-green-100 text-green-700 border-green-300' 
      : 'bg-gray-100 text-gray-600 border-gray-300'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{service.serviceName}</h3>
            <p className="text-sm text-white/90">{service.serviceCategory} • {service.city}, {service.state}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
            <MdClose className="text-xl text-white" />
          </button>
        </div>

        {/* Filters Bar (Sticky) */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-3 flex-shrink-0">
          <MdFilterList className="text-gray-600 text-xl" />
          
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Months</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={index} value={index}>{name}</option>
            ))}
          </select>

          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="From"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="To"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />

          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <MdRefresh className="text-base" />
            Reset
          </button>

          <div className="ml-auto text-sm font-medium text-gray-600">
            {filteredReservations.length} booking{filteredReservations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-500 text-lg mb-2">No bookings found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-6">Events</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredReservations.map((reservation) => (
                <div key={reservation.dateKey} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-2">
                      <div className="font-semibold text-gray-900">{reservation.dateDisplay}</div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                        {reservation.status === 'booked' ? 'Booked' : 'Blocked'}
                      </span>
                    </div>

                    <div className="col-span-6">
                      {reservation.events.length === 0 ? (
                        <span className="text-gray-400 text-sm">No events</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {reservation.events.slice(0, 2).map((event, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-900">{event.title}</span>
                              <span className="text-gray-500 ml-2">
                                {event.startTime} – {event.endTime}
                              </span>
                            </div>
                          ))}
                          {reservation.events.length > 2 && (
                            <span className="text-xs text-purple-600 font-medium">
                              +{reservation.events.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 text-right">
                      {reservation.events.length > 0 && (
                        <button
                          onClick={() => toggleRowExpansion(reservation.dateKey)}
                          className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          {expandedRows.has(reservation.dateKey) ? (
                            <>
                              Hide
                              <MdExpandLess className="text-lg" />
                            </>
                          ) : (
                            <>
                              View
                              <MdExpandMore className="text-lg" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(reservation.dateKey) && reservation.events.length > 0 && (
                    <div className="px-6 pb-4 bg-purple-50/50">
                      <div className="border-l-4 border-purple-300 pl-4 space-y-3">
                        {reservation.events.map((event) => (
                          <div key={event.id} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Title</p>
                                <p className="font-semibold text-gray-900">{event.title}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Type</p>
                                <p className="text-gray-700">{event.eventType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Time</p>
                                <p className="text-gray-700">{event.startTime}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">End Time</p>
                                <p className="text-gray-700">{event.endTime}</p>
                              </div>
                              
                              {/* Customer Details - Conditional Rendering */}
                              {event.customerName && (
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Name</p>
                                  <p className="text-gray-700">{event.customerName}</p>
                                </div>
                              )}
                              
                              {event.customerPhone && (
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                                  <p className="text-gray-700">{event.customerPhone}</p>
                                </div>
                              )}
                              
                              {event.customerAltPhone && (
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Alternative Phone</p>
                                  <p className="text-gray-700">{event.customerAltPhone}</p>
                                </div>
                              )}
                              
                              {event.customerAddress && (
                                <div className="col-span-2">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Address</p>
                                  <p className="text-gray-700">{event.customerAddress}</p>
                                </div>
                              )}
                              
                              {event.additionalNotes && (
                                <div className="col-span-2">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Additional Notes</p>
                                  <p className="text-gray-700 whitespace-pre-wrap">{event.additionalNotes}</p>
                                </div>
                              )}
                              
                              <div className="col-span-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Booking ID</p>
                                <p className="text-xs font-mono text-gray-600">{event.id}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
