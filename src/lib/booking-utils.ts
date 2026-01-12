import { CalendarEvent, ServiceAvailabilityDoc } from '@/lib/firestore-utils'

/**
 * Flattened booking entry for display
 */
export interface ReservationEntry {
  dateKey: string
  dateDisplay: string
  dateObj: Date
  serviceId: string
  serviceName: string
  serviceCategory: string
  status: 'booked' | 'blocked'
  events: CalendarEvent[]
}

/**
 * Format date for display
 */
function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Extract bookings from availability document
 */
export function extractReservationsFromAvailability(
  availabilityDoc: ServiceAvailabilityDoc,
  serviceName: string,
  serviceCategory: string
): ReservationEntry[] {
  const reservations: ReservationEntry[] = []
  
  if (!availabilityDoc.calendar) {
    return reservations
  }
  
  // Iterate through calendar MAP
  Object.entries(availabilityDoc.calendar).forEach(([dateKey, dayData]) => {
    if (dayData.status === 'booked' || dayData.status === 'blocked') {
      const [year, month, day] = dateKey.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      
      reservations.push({
        dateKey,
        dateDisplay: formatDateForDisplay(dateObj),
        dateObj,
        serviceId: availabilityDoc.serviceId,
        serviceName,
        serviceCategory,
        status: dayData.status,
        events: dayData.events || []
      })
    }
  })
  
  return reservations
}

/**
 * Get upcoming N bookings from today
 */
export function getUpcomingReservations(
  reservations: ReservationEntry[],
  count: number = 3
): ReservationEntry[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return reservations
    .filter(r => r.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, count)
}

/**
 * Sort reservations by date (ascending by default)
 */
export function sortReservations(
  reservations: ReservationEntry[],
  ascending: boolean = true
): ReservationEntry[] {
  return [...reservations].sort((a, b) => {
    const diff = a.dateObj.getTime() - b.dateObj.getTime()
    return ascending ? diff : -diff
  })
}

/**
 * Filter reservations by month and year
 */
export function filterByMonthYear(
  reservations: ReservationEntry[],
  month?: number,
  year?: number
): ReservationEntry[] {
  return reservations.filter(r => {
    if (month !== undefined && r.dateObj.getMonth() !== month) {
      return false
    }
    if (year !== undefined && r.dateObj.getFullYear() !== year) {
      return false
    }
    return true
  })
}

/**
 * Filter reservations by date range
 */
export function filterByDateRange(
  reservations: ReservationEntry[],
  startDate?: Date,
  endDate?: Date
): ReservationEntry[] {
  return reservations.filter(r => {
    if (startDate) {
      // Set time to start of day for inclusive comparison
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const reservationDate = new Date(r.dateObj)
      reservationDate.setHours(0, 0, 0, 0)
      
      if (reservationDate < start) {
        return false
      }
    }
    if (endDate) {
      // Set time to end of day for inclusive comparison
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      const reservationDate = new Date(r.dateObj)
      
      if (reservationDate > end) {
        return false
      }
    }
    return true
  })
}

/**
 * Get months to load for current view (current, previous, next)
 */
export function getMonthsToLoad(referenceDate: Date = new Date()): string[] {
  const months: string[] = []
  
  // Previous month
  const prevMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)
  months.push(formatYearMonth(prevMonth))
  
  // Current month
  months.push(formatYearMonth(referenceDate))
  
  // Next month
  const nextMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)
  months.push(formatYearMonth(nextMonth))
  
  return months
}

/**
 * Format date as yyyy-mm
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get unique years from reservations
 */
export function extractUniqueYears(reservations: ReservationEntry[]): number[] {
  const years = new Set<number>()
  reservations.forEach(r => years.add(r.dateObj.getFullYear()))
  return Array.from(years).sort((a, b) => b - a) // Descending
}

/**
 * Get month names
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
