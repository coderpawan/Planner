import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  deleteField
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import {
  getAvailabilityDocId,
  formatDateKey,
  getYearMonth,
  ServiceAvailabilityDoc,
  CalendarDay,
  CalendarEvent
} from '@/lib/firestore-utils'

/**
 * Gets availability for a service for a specific month
 * Returns calendar MAP structure
 */
export async function getServiceAvailability(
  serviceId: string,
  date: Date
): Promise<ServiceAvailabilityDoc | null> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  return snapshot.data() as ServiceAvailabilityDoc
}

/**
 * Initializes availability document for a service month if it doesn't exist
 */
export async function initializeAvailabilityDoc(
  serviceId: string,
  vendorId: string,
  cityId: string,
  serviceCategory: string,
  date: Date
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    await setDoc(docRef, {
      serviceId,
      vendorId,
      cityId,
      serviceCategory,
      yearMonth: getYearMonth(date),
      calendar: {},
      updatedAt: serverTimestamp()
    })
  }
}

/**
 * Adds or updates an event on a specific date
 * Uses dot-notation to update nested MAP
 */
export async function addEventToDate(
  serviceId: string,
  vendorId: string,
  cityId: string,
  serviceCategory: string,
  date: Date,
  event: CalendarEvent
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const dateKey = formatDateKey(date)
  const availabilityRef = doc(firestore, 'service_availability', docId)
  
  const availabilityDoc = await getDoc(availabilityRef)
  
  if (!availabilityDoc.exists()) {
    // Create new document with the event
    const calendarData: CalendarDay = {
      status: 'booked' as const,
      events: [event]
    }
    
    const newData: ServiceAvailabilityDoc = {
      serviceId,
      vendorId,
      cityId,
      serviceCategory,
      yearMonth: getYearMonth(date),
      calendar: {
        [dateKey]: calendarData
      },
      updatedAt: serverTimestamp()
    }
    await setDoc(availabilityRef, newData)
  } else {
    const existingData = availabilityDoc.data() as ServiceAvailabilityDoc
    const currentDayData = existingData.calendar[dateKey]
    
    if (!currentDayData) {
      // Date doesn't exist, create it with the event
      const calendarData: CalendarDay = {
        status: 'booked' as const,
        events: [event]
      }
      
      await updateDoc(availabilityRef, {
        [`calendar.${dateKey}`]: calendarData,
        updatedAt: serverTimestamp()
      })
    } else {
      // Date exists, append event
      const updatedEvents = [...(currentDayData.events || []), event]
      
      await updateDoc(availabilityRef, {
        [`calendar.${dateKey}.events`]: updatedEvents,
        [`calendar.${dateKey}.status`]: 'booked' as const,
        updatedAt: serverTimestamp()
      })
    }
  }
}

/**
 * Updates an existing event on a date
 */
export async function updateEventOnDate(
  serviceId: string,
  date: Date,
  eventId: string,
  updatedEvent: Partial<CalendarEvent>
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  const dateKey = formatDateKey(date)
  
  // Get current day data
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) {
    throw new Error('Availability document not found')
  }
  
  const data = snapshot.data() as ServiceAvailabilityDoc
  const currentDay: CalendarDay = data.calendar?.[dateKey]
  
  if (!currentDay) {
    throw new Error('Date not found in calendar')
  }
  
  // Update event in array
  const updatedEvents = currentDay.events.map(evt =>
    evt.id === eventId ? { ...evt, ...updatedEvent } : evt
  )
  
  // Update using dot-notation
  await updateDoc(docRef, {
    [`calendar.${dateKey}.events`]: updatedEvents,
    updatedAt: serverTimestamp()
  })
}

/**
 * Removes an event from a date
 * Only allows deletion if deleteAllowed is true (unless isAdmin is true)
 */
export async function removeEventFromDate(
  serviceId: string,
  date: Date,
  eventId: string,
  isAdmin: boolean = false
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  const dateKey = formatDateKey(date)
  
  // Get current day data
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) {
    throw new Error('Availability document not found')
  }
  
  const data = snapshot.data() as ServiceAvailabilityDoc
  const currentDay: CalendarDay = data.calendar?.[dateKey]
  
  if (!currentDay) {
    throw new Error('Date not found in calendar')
  }
  
  // Check if event can be deleted
  const eventToDelete = currentDay.events.find(evt => evt.id === eventId)
  if (!eventToDelete) {
    throw new Error('Event not found')
  }
  
  // Admin can delete any event, vendor can only delete if deleteAllowed is true
  if (!isAdmin && eventToDelete.deleteAllowed === false) {
    throw new Error('This event cannot be deleted. Please contact customer support.')
  }
  
  // Remove event from array
  const updatedEvents = currentDay.events.filter(evt => evt.id !== eventId)
  
  if (updatedEvents.length === 0) {
    // If no events left, remove the date entirely (make it available)
    await updateDoc(docRef, {
      [`calendar.${dateKey}`]: deleteField(),
      updatedAt: serverTimestamp()
    })
  } else {
    // Update events array
    await updateDoc(docRef, {
      [`calendar.${dateKey}.events`]: updatedEvents,
      updatedAt: serverTimestamp()
    })
  }
}

/**
 * Blocks a date (no events, just blocked)
 */
export async function blockDate(
  serviceId: string,
  vendorId: string,
  cityId: string,
  serviceCategory: string,
  date: Date
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  const dateKey = formatDateKey(date)
  
  // Ensure document exists
  await initializeAvailabilityDoc(serviceId, vendorId, cityId, serviceCategory, date)
  
  // Block date with no events
  const blockedDay: CalendarDay = {
    status: 'blocked' as const,
    events: []
  }
  
  await updateDoc(docRef, {
    [`calendar.${dateKey}`]: blockedDay,
    updatedAt: serverTimestamp()
  })
}

/**
 * Unblocks a date (removes it from calendar, making it available)
 */
export async function unblockDate(
  serviceId: string,
  date: Date
): Promise<void> {
  const docId = getAvailabilityDocId(serviceId, date)
  const docRef = doc(firestore, 'service_availability', docId)
  const dateKey = formatDateKey(date)
  
  // Remove date from calendar
  await updateDoc(docRef, {
    [`calendar.${dateKey}`]: deleteField(),
    updatedAt: serverTimestamp()
  })
}

/**
 * Checks if a date is available
 * A date is available if it doesn't exist in the calendar MAP
 */
export async function isDateAvailable(
  serviceId: string,
  date: Date
): Promise<boolean> {
  const availability = await getServiceAvailability(serviceId, date)
  
  if (!availability) {
    return true // No availability doc = all dates available
  }
  
  const dateKey = formatDateKey(date)
  return !availability.calendar[dateKey] // If key doesn't exist, it's available
}
