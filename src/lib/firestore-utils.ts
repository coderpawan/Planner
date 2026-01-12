/**
 * Firestore utilities for production-ready schema
 * Letter casing rules:
 * - Collection/path names: lowercase_snake_case
 * - City IDs: lowercase with underscores (new_delhi)
 * - Service categories: lowercase_snake_case (mehendi_artist)
 * - Field names: camelCase
 * - Enum values: lowercase strings
 */

/**
 * Normalizes city name to Firestore city ID format
 * Example: "New Delhi" → "new_delhi"
 */
export function normalizeCityId(cityName: string): string {
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Normalizes service category to Firestore format
 * Example: "Mehendi Artist" → "mehendi_artist"
 */
export function normalizeServiceCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/\//g, '_') // DJ/Band → dj_band
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Generates service availability document ID
 * Format: {serviceId}_{yyyy_mm}
 */
export function getAvailabilityDocId(serviceId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${serviceId}_${year}_${month}`
}

/**
 * Formats date to calendar key format (yyyy-mm-dd)
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parses date key back to Date object
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Gets year-month string from date (yyyy-mm)
 */
export function getYearMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Constructs service document path
 * Path: vendor_services/{cityId}/{serviceCategory}/{serviceId}
 */
export function getServicePath(cityId: string, serviceCategory: string, serviceId: string): string {
  return `vendor_services/${cityId}/${serviceCategory}/${serviceId}`
}

/**
 * Constructs service collection path
 * Path: vendor_services/{cityId}/{serviceCategory}
 */
export function getServiceCollectionPath(cityId: string, serviceCategory: string): string {
  return `vendor_services/${cityId}/${serviceCategory}`
}

/**
 * Validates date key format
 */
export function isValidDateKey(dateKey: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  return datePattern.test(dateKey)
}

/**
 * Event status enum
 */
export type EventStatus = 'booked' | 'blocked' | 'available'

/**
 * Calendar day structure
 */
export interface CalendarDay {
  status: 'booked' | 'blocked'
  events: CalendarEvent[]
}

/**
 * Calendar day data structure
 */
export interface CalendarDayData {
  status: 'available' | 'blocked' | 'booked'
  events?: CalendarEvent[]
}

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string
  title: string
  eventType: string
  startTime: string
  endTime: string
  deleteAllowed: boolean
  customerName?: string
  customerPhone?: string
  customerAltPhone?: string
  customerAddress?: string
  additionalNotes?: string
}

/**
 * Service availability document structure
 */
export interface ServiceAvailabilityDoc {
  serviceId: string
  vendorId: string
  cityId: string
  serviceCategory: string
  yearMonth: string
  calendar: Record<string, CalendarDay>
  createdAt?: any
  updatedAt?: any // Firestore Timestamp
}

/**
 * Vendor service document structure
 */
export interface VendorServiceDoc {
  serviceId: string
  vendorId: string
  serviceName: string
  cityId: string
  city: string // Display name
  state: string
  serviceCategory: string
  
  startingPrice: number
  priceMax?: number
  pricingUnit: string
  description: string
  experienceYears?: number
  address: string
  googleMapLink?: string
  
  images: string[]
  highlights?: string[]
  
  ownerName: string
  phoneNumber: string
  alternativePhoneNumber?: string
  
  active: boolean
  verified: boolean
  
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  
  // Category-specific fields
  capacity?: string | number
  serviceType?: string
  vegNonVeg?: string
  cuisines?: string[]
  planningTypes?: string[]
  equipment?: string[]
  packages?: string[]
  
  // Allow additional dynamic fields
  [key: string]: any
}
