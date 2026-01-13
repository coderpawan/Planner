'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { VendorServiceDoc } from '@/lib/firestore-utils'
import { 
  BudgetRange, 
  ServiceCategoryRule,
  getBudgetConfig, 
  getPriorityServices, 
  getOptionalServices,
  normalizeFirestoreCategoryToConfig,
  isServiceEligible
} from '@/config/weddingBudgetConfig'
import { normalizeCityId } from '@/lib/firestore-utils'
import ServiceCard from '@/components/budget/ServiceCard'
import ServiceDetailModal from '@/components/budget/ServiceDetailModal'
import CitySelectorDropdown from '@/components/common/CitySelectorDropdown'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface GroupedServices {
  [category: string]: {
    rule: ServiceCategoryRule
    services: VendorServiceDoc[]
  }
}

export default function BudgetPage() {
  const params = useParams()
  const router = useRouter()
  const budgetRange = params?.budgetRange as BudgetRange

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cityName, setCityName] = useState<string | null>(null)
  const [priorityServices, setPriorityServices] = useState<GroupedServices>({})
  const [optionalServices, setOptionalServices] = useState<GroupedServices>({})
  const [selectedService, setSelectedService] = useState<VendorServiceDoc | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Date filter states
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filteringByDate, setFilteringByDate] = useState(false)
  const [allServicesCache, setAllServicesCache] = useState<VendorServiceDoc[]>([])

  const scrollContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    fetchServices()
  }, [budgetRange, cityName])

  const handleCityChange = (newCity: string) => {
    setCityName(newCity)
    localStorage.setItem('city', newCity)
    // Clear date filters when city changes
    setStartDate('')
    setEndDate('')
    setFilteringByDate(false)
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Get city from state or localStorage, default to Bangalore
      let selectedCity = cityName
      if (!selectedCity) {
        selectedCity = localStorage.getItem('city')
        if (!selectedCity) {
          // Use Bangalore as default city for browsing
          selectedCity = 'Bangalore, Karnataka'
        }
        setCityName(selectedCity)
      }

      // 2. Normalize city to cityId
      const cityId = normalizeCityId(selectedCity)

      // 3. Get budget configuration
      const budgetConfig = getBudgetConfig(budgetRange)
      const priorityRules = getPriorityServices(budgetRange)
      const optionalRules = getOptionalServices(budgetRange)

      // 4. Get all unique Firestore categories we need to fetch
      const allCategories = new Set<string>()
      
      const firestoreCategoryMapping: Record<string, string[]> = {
        'venue': ['venue'],
        'wedding_planner': ['wedding_planner'],
        'catering': ['catering'],
        'decor': ['decor'],
        'photography': ['photography'],
        'makeup_styling': ['makeup_styling'],
        'music_entertainment': ['music_entertainment'],
        'choreography': ['choreography'],
        'ritual_services': ['ritual_services'],
        'wedding_transport': ['wedding_transport'],
        'invitations_gifting': ['invitations_gifting']
      }

      budgetConfig.services.forEach(rule => {
        const firestoreCategories = firestoreCategoryMapping[rule.category] || []
        firestoreCategories.forEach(cat => allCategories.add(cat))
      })

      // 5. Fetch all services in parallel
      const fetchPromises = Array.from(allCategories).map(async (firestoreCategory) => {
        try {
          const categoryPath = `vendor_services/${cityId}/${firestoreCategory}`
          const servicesRef = collection(firestore, categoryPath)
          const servicesQuery = query(servicesRef, where('active', '==', true))
          const snapshot = await getDocs(servicesQuery)
          
          return snapshot.docs.map(doc => doc.data() as VendorServiceDoc)
        } catch (err) {
          return []
        }
      })

      const resultsArray = await Promise.all(fetchPromises)
      const allServices = resultsArray.flat()
      
      // Cache all services for date filtering
      setAllServicesCache(allServices)

      // 6. Filter and group services
      await groupAndSetServices(allServices, priorityRules, optionalRules)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching services:', err)
      setError('Failed to load services. Please try again.')
      setLoading(false)
    }
  }

  const checkServiceAvailability = async (serviceId: string, startDate: string, endDate: string): Promise<boolean> => {
    try {
      // Generate all dates between start and end (inclusive)
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dates: string[] = []
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }

      // Group dates by month to minimize Firestore queries
      const datesByMonth = new Map<string, string[]>()
      
      dates.forEach(date => {
        const [year, month] = date.split('-')
        const monthKey = `${year}-${month}`
        if (!datesByMonth.has(monthKey)) {
          datesByMonth.set(monthKey, [])
        }
        datesByMonth.get(monthKey)!.push(date)
      })

      // Query service_availability for each month
      const monthEntries = Array.from(datesByMonth.entries())
      
      for (const [monthKey, datesInMonth] of monthEntries) {
        const [year, month] = monthKey.split('-')
        const docId = `${serviceId}_${year}_${month}`
        
        const docRef = doc(firestore, 'service_availability', docId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          const calendar = data.calendar || {}
          
          // Check if any of the required dates in this month are booked/blocked
          for (const date of datesInMonth) {
            // The calendar uses full date strings as keys (e.g., '2026-01-13')
            // NOT just the day number
            if (calendar[date]) {
              const dateInfo = calendar[date]
              const status = dateInfo.status
              
              // If status is 'booked' or 'blocked', service is not available
              if (status === 'booked' || status === 'blocked') {
                return false
              }
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  const groupAndSetServices = async (
    allServices: VendorServiceDoc[], 
    priorityRules: ServiceCategoryRule[], 
    optionalRules: ServiceCategoryRule[],
    filterByAvailability: boolean = false
  ) => {
    const priorityGrouped: GroupedServices = {}
    const optionalGrouped: GroupedServices = {}

    // Process priority services
    for (const rule of priorityRules) {
      let matchingServices = allServices.filter(service => {
        const configCategory = normalizeFirestoreCategoryToConfig(service.serviceCategory)
        if (configCategory !== rule.category) return false

        if (!service.startingPrice && service.startingPrice !== 0) return false
        if (!service.pricingUnit) return false

        return isServiceEligible(service.startingPrice, service.pricingUnit, rule)
      })

      // Filter by availability if dates are selected
      if (filterByAvailability && startDate && endDate) {
        const availabilityChecks = await Promise.all(
          matchingServices.map(async (service) => {
            const isAvailable = await checkServiceAvailability(service.serviceId, startDate, endDate)
            return { service, isAvailable }
          })
        )
        matchingServices = availabilityChecks
          .filter(result => result.isAvailable)
          .map(result => result.service)
      }
      
      if (matchingServices.length > 0) {
        priorityGrouped[rule.category] = {
          rule,
          services: matchingServices
        }
      }
    }

    // Process optional services
    for (const rule of optionalRules) {
      let matchingServices = allServices.filter(service => {
        const configCategory = normalizeFirestoreCategoryToConfig(service.serviceCategory)
        if (configCategory !== rule.category) return false

        if (!service.startingPrice && service.startingPrice !== 0) return false
        if (!service.pricingUnit) return false

        return isServiceEligible(service.startingPrice, service.pricingUnit, rule)
      })

      if (filterByAvailability && startDate && endDate) {
        const availabilityChecks = await Promise.all(
          matchingServices.map(async (service) => {
            const isAvailable = await checkServiceAvailability(service.serviceId, startDate, endDate)
            return { service, isAvailable }
          })
        )
        matchingServices = availabilityChecks
          .filter(result => result.isAvailable)
          .map(result => result.service)
      }

      if (matchingServices.length > 0) {
        optionalGrouped[rule.category] = {
          rule,
          services: matchingServices
        }
      }
    }

    setPriorityServices(priorityGrouped)
    setOptionalServices(optionalGrouped)
  }

  const handleApplyDateFilter = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date')
      return
    }

    setFilteringByDate(true)
    setLoading(true)

    const priorityRules = getPriorityServices(budgetRange)
    const optionalRules = getOptionalServices(budgetRange)

    await groupAndSetServices(allServicesCache, priorityRules, optionalRules, true)
    
    setLoading(false)
  }

  const handleClearDateFilter = async () => {
    setStartDate('')
    setEndDate('')
    setFilteringByDate(false)
    setLoading(true)

    const priorityRules = getPriorityServices(budgetRange)
    const optionalRules = getOptionalServices(budgetRange)

    await groupAndSetServices(allServicesCache, priorityRules, optionalRules, false)
    
    setLoading(false)
  }

  const handleScroll = (category: string, direction: 'left' | 'right') => {
    const container = scrollContainerRefs.current[category]
    if (!container) return

    const scrollAmount = 340 // Width of one card + gap
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  const handleServiceClick = (service: VendorServiceDoc) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedService(null)
  }

  if (loading) {
    return <LoadingSpinner size="lg" message={`Loading services for ${cityName || 'your city'}...`} fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  const budgetConfig = getBudgetConfig(budgetRange)
  const hasPriorityServices = Object.keys(priorityServices).length > 0
  const hasOptionalServices = Object.keys(optionalServices).length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - Not sticky, scrollable */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Wedding Services {budgetConfig.displayRange}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {budgetConfig.description}
              </p>
            </div>

            {/* City Selector and Date Filter - All in one line on desktop */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              {/* City Selector */}
              <div className="w-full lg:w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City
                </label>
                <CitySelectorDropdown
                  selectedCity={cityName || ''}
                  onCityChange={handleCityChange}
                />
              </div>

              {/* Date Range Filter - Start and End on same line for mobile and desktop */}
              <div className="flex gap-2 lg:gap-3 flex-1">
                <div className="flex-1 lg:w-40 lg:flex-initial">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="flex-1 lg:w-40 lg:flex-initial">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 lg:flex-shrink-0">
                <button
                  onClick={handleApplyDateFilter}
                  disabled={!startDate || !endDate}
                  className="flex-1 lg:flex-initial px-4 py-1.5 text-sm bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
                
                {filteringByDate && (
                  <button
                    onClick={handleClearDateFilter}
                    className="flex-1 lg:flex-initial px-4 py-1.5 text-sm bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Indicator - More Compact */}
            {filteringByDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">Filtering:</span> {startDate} to {endDate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasPriorityServices && !hasOptionalServices && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filteringByDate ? 'No Available Services' : 'No Services Available'}
            </h3>
            <p className="text-gray-600">
              {filteringByDate 
                ? `No services are available for the selected dates (${startDate} to ${endDate}) in ${cityName}.`
                : `We don't have services in this budget range for ${cityName} yet.`
              }
            </p>
            {filteringByDate ? (
              <button
                onClick={handleClearDateFilter}
                className="mt-6 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Clear Date Filter
              </button>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="mt-6 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Explore Other Options
              </button>
            )}
          </div>
        )}

        {/* Priority Services */}
        {hasPriorityServices && (
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                ✅ Priority Services
              </h2>
              <p className="text-gray-600">
                Essential services for your perfect wedding day
              </p>
            </div>

            {Object.entries(priorityServices).map(([category, { rule, services }]) => (
              <div key={category} className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {rule.displayName}
                    </h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {services.length} {services.length === 1 ? 'service' : 'services'}
                  </span>
                </div>

                <div className="relative group">
                  {/* Left Arrow Button */}
                  {services.length > 1 && (
                    <button
                      onClick={() => handleScroll(`priority-${category}`, 'left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
                      aria-label="Scroll left"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  <div className="-mx-4 sm:mx-0">
                    <div 
                      ref={(el) => { scrollContainerRefs.current[`priority-${category}`] = el }}
                      className="overflow-x-auto scrollbar-hide px-4 sm:px-0"
                    >
                      <div className="flex gap-6 pb-4 min-w-min">
                        {services.map((service) => (
                          <div key={service.serviceId} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px]">
                            <ServiceCard
                              service={service}
                              onClick={() => handleServiceClick(service)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow Button */}
                  {services.length > 1 && (
                    <button
                      onClick={() => handleScroll(`priority-${category}`, 'right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
                      aria-label="Scroll right"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Scroll indicator for mobile */}
                  {services.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2 sm:hidden">
                      {services.slice(0, Math.min(services.length, 5)).map((_, index) => (
                        <div key={index} className="w-2 h-2 rounded-full bg-gray-300"></div>
                      ))}
                      {services.length > 5 && (
                        <span className="text-xs text-gray-400 ml-1">+{services.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optional Services */}
        {hasOptionalServices && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                ➕ Optional Services
              </h2>
              <p className="text-gray-600">
                Additional services to make your celebration even more special
              </p>
            </div>

            {Object.entries(optionalServices).map(([category, { rule, services }]) => (
              <div key={category} className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {rule.displayName}
                    </h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {services.length} {services.length === 1 ? 'service' : 'services'}
                  </span>
                </div>

                <div className="relative group">
                  {/* Left Arrow Button */}
                  {services.length > 1 && (
                    <button
                      onClick={() => handleScroll(`optional-${category}`, 'left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
                      aria-label="Scroll left"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  <div className="-mx-4 sm:mx-0">
                    <div 
                      ref={(el) => { scrollContainerRefs.current[`optional-${category}`] = el }}
                      className="overflow-x-auto scrollbar-hide px-4 sm:px-0"
                    >
                      <div className="flex gap-6 pb-4 min-w-min">
                        {services.map((service) => (
                          <div key={service.serviceId} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px]">
                            <ServiceCard
                              service={service}
                              onClick={() => handleServiceClick(service)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow Button */}
                  {services.length > 1 && (
                    <button
                      onClick={() => handleScroll(`optional-${category}`, 'right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
                      aria-label="Scroll right"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Scroll indicator for mobile */}
                  {services.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2 sm:hidden">
                      {services.slice(0, Math.min(services.length, 5)).map((_, index) => (
                        <div key={index} className="w-2 h-2 rounded-full bg-gray-300"></div>
                      ))}
                      {services.length > 5 && (
                        <span className="text-xs text-gray-400 ml-1">+{services.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
