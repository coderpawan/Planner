import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection,
  collectionGroup,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  writeBatch,
  deleteField,
  arrayRemove
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import {
  normalizeCityId,
  normalizeServiceCategory,
  getServicePath,
  getServiceCollectionPath,
  VendorServiceDoc
} from '@/lib/firestore-utils'

/**
 * Creates or updates a vendor service
 */
export async function saveVendorService(
  serviceId: string,
  serviceData: Partial<VendorServiceDoc>
): Promise<void> {
  const cityId = normalizeCityId(serviceData.city || '')
  const categoryId = normalizeServiceCategory(serviceData.serviceCategory || '')
  
  const docPath = getServicePath(cityId, categoryId, serviceId)
  const serviceRef = doc(firestore, docPath)
  
  const dataToSave: any = {
    ...serviceData,
    serviceId,
    cityId,
    updatedAt: serverTimestamp()
  }
  
  if (!serviceData.createdAt) {
    dataToSave.createdAt = serverTimestamp()
  }
  
  await setDoc(serviceRef, dataToSave, { merge: true })
}

/**
 * Updates the active status of a vendor service
 * Only modifies the 'active' field without overwriting other data
 */
export async function updateServiceActiveStatus(
  cityId: string,
  serviceCategory: string,
  serviceId: string,
  active: boolean
): Promise<void> {
  const normalizedCityId = normalizeCityId(cityId)
  const normalizedCategory = normalizeServiceCategory(serviceCategory)
  
  const docPath = getServicePath(normalizedCityId, normalizedCategory, serviceId)
  const serviceRef = doc(firestore, docPath)
  
  await updateDoc(serviceRef, {
    active,
    updatedAt: serverTimestamp()
  })
}

/**
 * Gets a single vendor service
 */
export async function getVendorService(
  cityId: string,
  serviceCategory: string,
  serviceId: string
): Promise<VendorServiceDoc | null> {
  const normalizedCityId = normalizeCityId(cityId)
  const normalizedCategory = normalizeServiceCategory(serviceCategory)
  
  const docPath = getServicePath(normalizedCityId, normalizedCategory, serviceId)
  const serviceRef = doc(firestore, docPath)
  
  const snapshot = await getDoc(serviceRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  return snapshot.data() as VendorServiceDoc
}

/**
 * Gets all services for a vendor across their registered cities and all categories
 * Steps:
 * 1. Get vendor profile to find their cities array
 * 2. For each city, query all service categories
 * 3. Match vendorId and return services
 */
export async function getVendorServices(vendorId: string): Promise<VendorServiceDoc[]> {
  try {
    const services: VendorServiceDoc[] = []
    
    // Step 1: Get vendor profile to find their registered cities
    const vendorRef = doc(firestore, 'VerifiedVendors', vendorId)
    const vendorSnap = await getDoc(vendorRef)
    
    if (!vendorSnap.exists()) {
      console.error('Vendor profile not found')
      return []
    }
    
    const vendorData = vendorSnap.data()
    const vendorCities = vendorData.cities || []
    
    if (vendorCities.length === 0) {
      console.log('No cities found in vendor profile')
      return []
    }
    
    console.log('Vendor cities:', vendorCities)
    
    // Fetch all possible service categories from Firestore
    const categoryIds = await getCategoryIds()
    
    // Step 2: For each city the vendor operates in
    for (const cityObj of vendorCities) {
      const cityId = normalizeCityId(cityObj.city)
      console.log(`Querying city: ${cityId} (${cityObj.city})`)
      
      // Step 3: For each service category in this city
      for (const categoryId of categoryIds) {
        try {
          // Build path: vendor_services/{cityId}/{categoryId}
          const categoryPath = `vendor_services/${cityId}/${categoryId}`
          const categoryRef = collection(firestore, categoryPath)
          
          // Query for this vendor's services (include both active and inactive)
          const servicesQuery = query(
            categoryRef,
            where('vendorId', '==', vendorId)
          )
          
          const snapshot = await getDocs(servicesQuery)
          
          if (!snapshot.empty) {
            console.log(`Found ${snapshot.size} services in ${cityId}/${categoryId}`)
            snapshot.docs.forEach(docSnap => {
              services.push(docSnap.data() as VendorServiceDoc)
            })
          }
        } catch (error) {
          // Collection might not exist, continue
          console.log(`No services in ${cityId}/${categoryId}:`, error)
        }
      }
    }
    
    console.log(`Total services found: ${services.length}`)
    return services
  } catch (error) {
    console.error('Error fetching vendor services:', error)
    return []
  }
}

/**
 * Gets services for a specific city and category
 */
export async function getServicesByCityAndCategory(
  cityId: string,
  serviceCategory: string,
  activeOnly: boolean = true
): Promise<VendorServiceDoc[]> {
  const normalizedCityId = normalizeCityId(cityId)
  const normalizedCategory = normalizeServiceCategory(serviceCategory)
  
  const collectionPath = getServiceCollectionPath(normalizedCityId, normalizedCategory)
  const servicesRef = collection(firestore, collectionPath)
  
  let servicesQuery = query(servicesRef)
  
  if (activeOnly) {
    servicesQuery = query(servicesRef, where('active', '==', true))
  }
  
  const snapshot = await getDocs(servicesQuery)
  return snapshot.docs.map(docSnap => docSnap.data() as VendorServiceDoc)
}

/**
 * Gets a service by serviceId using collectionGroup query
 * This searches across all cities and categories
 */
export async function getServiceByServiceId(serviceId: string): Promise<VendorServiceDoc | null> {
  try {
    // Use collectionGroup to search across all subcollections
    const servicesQuery = query(
      collectionGroup(firestore, 'services'),
      where('serviceId', '==', serviceId)
    )
    
    const snapshot = await getDocs(servicesQuery)
    
    if (snapshot.empty) {
      return null
    }
    
    // Return the first match (should only be one)
    return snapshot.docs[0].data() as VendorServiceDoc
  } catch (error) {
    console.error('Error fetching service by ID:', error)
    return null
  }
}

/**
 * Gets a service by serviceId, city, and category using direct path
 * This is more efficient than collectionGroup query
 */
export async function getServiceByIdCityCategory(
  serviceId: string,
  city: string,
  category: string
): Promise<VendorServiceDoc | null> {
  try {
    const cityId = normalizeCityId(city)
    const categoryId = normalizeServiceCategory(category)
    
    const docPath = getServicePath(cityId, categoryId, serviceId)
    const serviceRef = doc(firestore, docPath)
    
    const docSnap = await getDoc(serviceRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as VendorServiceDoc
    }
    
    return null
  } catch (error) {
    console.error('Error fetching service by ID, city, category:', error)
    return null
  }
}

/**
 * Deletes a vendor service and all related data
 */
export async function deleteVendorService(
  cityId: string,
  serviceCategory: string,
  serviceId: string
): Promise<void> {
  const normalizedCityId = normalizeCityId(cityId)
  const normalizedCategory = normalizeServiceCategory(serviceCategory)
  
  // Delete main service document
  const docPath = getServicePath(normalizedCityId, normalizedCategory, serviceId)
  const serviceRef = doc(firestore, docPath)
  await deleteDoc(serviceRef)
  
  // Delete all availability documents for this service
  await deleteServiceAvailabilityDocs(serviceId)
  
  // Delete all bookings for this service
  await deleteServiceBookings(serviceId)
  
  // Delete all reviews for this service
  await deleteServiceReviews(serviceId)
  
  // Remove service from all user carts
  await removeServiceFromCarts(serviceId)
  
  // Remove service from all unlocked_services
  await removeServiceFromUnlockedServices(serviceId)
  
  // Remove service from all user_engagements
  await removeServiceFromUserEngagements(serviceId)
}

/**
 * Helper: Delete all availability documents for a service
 */
async function deleteServiceAvailabilityDocs(serviceId: string): Promise<void> {
  const availabilityRef = collection(firestore, 'service_availability')
  const q = query(availabilityRef, where('serviceId', '==', serviceId))
  
  const snapshot = await getDocs(q)
  
  if (!snapshot.empty) {
    const batch = writeBatch(firestore)
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref)
    })
    await batch.commit()
  }
}

/**
 * Helper: Delete all bookings for a service
 */
async function deleteServiceBookings(serviceId: string): Promise<void> {
  const bookingsRef = collection(firestore, 'bookings')
  const q = query(bookingsRef, where('serviceId', '==', serviceId))
  
  const snapshot = await getDocs(q)
  
  if (!snapshot.empty) {
    const batch = writeBatch(firestore)
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref)
    })
    await batch.commit()
  }
}

/**
 * Helper: Delete all reviews for a service
 */
async function deleteServiceReviews(serviceId: string): Promise<void> {
  const reviewsRef = collection(firestore, 'reviews')
  const q = query(reviewsRef, where('serviceId', '==', serviceId))
  
  const snapshot = await getDocs(q)
  
  if (!snapshot.empty) {
    const batch = writeBatch(firestore)
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref)
    })
    await batch.commit()
  }
}

/**
 * Helper: Remove service from all user carts
 * Each cart doc has fields named by serviceId - we delete that field
 */
async function removeServiceFromCarts(serviceId: string): Promise<void> {
  try {
    const cartRef = collection(firestore, 'cart')
    const snapshot = await getDocs(cartRef)
    
    if (snapshot.empty) return
    
    const batch = writeBatch(firestore)
    let batchCount = 0
    
    snapshot.docs.forEach(docSnap => {
      const cartData = docSnap.data()
      
      // Check if this cart has the serviceId as a field
      if (cartData && cartData[serviceId]) {
        batch.update(docSnap.ref, {
          [serviceId]: deleteField()
        })
        batchCount++
      }
    })
    
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Removed service from ${batchCount} carts`)
    }
  } catch (error) {
    console.error('Error removing service from carts:', error)
    // Don't throw - continue with other cleanup
  }
}

/**
 * Helper: Remove service from all unlocked_services documents
 * Each doc has a 'services' array containing serviceIds
 */
async function removeServiceFromUnlockedServices(serviceId: string): Promise<void> {
  try {
    const unlockedRef = collection(firestore, 'unlocked_services')
    const snapshot = await getDocs(unlockedRef)
    
    if (snapshot.empty) return
    
    const batch = writeBatch(firestore)
    let batchCount = 0
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data()
      
      // Check if services array contains this serviceId
      if (data && data.services && Array.isArray(data.services)) {
        if (data.services.includes(serviceId)) {
          batch.update(docSnap.ref, {
            services: arrayRemove(serviceId)
          })
          batchCount++
        }
      }
    })
    
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Removed service from ${batchCount} unlocked_services`)
    }
  } catch (error) {
    console.error('Error removing service from unlocked_services:', error)
    // Don't throw - continue with other cleanup
  }
}

/**
 * Helper: Remove service from all user_engagements documents
 * Each doc has an 'engagements' array with objects containing serviceId
 */
async function removeServiceFromUserEngagements(serviceId: string): Promise<void> {
  try {
    const engagementsRef = collection(firestore, 'user_engagements')
    const snapshot = await getDocs(engagementsRef)
    
    if (snapshot.empty) return
    
    const batch = writeBatch(firestore)
    let batchCount = 0
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data()
      
      // Check if engagements array exists and contains the serviceId
      if (data && data.engagements && Array.isArray(data.engagements)) {
        const filteredEngagements = data.engagements.filter(
          (engagement: any) => engagement.serviceId !== serviceId
        )
        
        // Only update if something was removed
        if (filteredEngagements.length !== data.engagements.length) {
          batch.update(docSnap.ref, {
            engagements: filteredEngagements
          })
          batchCount++
        }
      }
    })
    
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Removed service from ${batchCount} user_engagements`)
    }
  } catch (error) {
    console.error('Error removing service from user_engagements:', error)
    // Don't throw - continue with other cleanup
  }
}

/**
 * Service Categories - Fetched from Firestore
 */

export interface ServiceCategory {
  categoryId: string
  label: string
}

// Cache for categories to avoid repeated Firestore calls
let categoriesCache: ServiceCategory[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches all service categories from Firestore with caching
 */
export async function getAllServiceCategories(): Promise<ServiceCategory[]> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache
  }
  
  try {
    const categoriesSnapshot = await getDocs(collection(firestore, 'ServiceCategories'))
    const categories: ServiceCategory[] = []
    
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data()
      categories.push({
        categoryId: data.categoryId,
        label: data.label
      })
    })
    
    // Update cache
    categoriesCache = categories
    cacheTimestamp = now
    
    return categories
  } catch (error) {
    console.error('Error fetching service categories:', error)
    // Return empty array on error
    return []
  }
}

/**
 * Gets the label for a specific category ID
 */
export async function getCategoryLabel(categoryId: string): Promise<string> {
  const categories = await getAllServiceCategories()
  const category = categories.find(cat => cat.categoryId === categoryId)
  return category ? category.label : categoryId
}

/**
 * Gets all category IDs
 */
export async function getCategoryIds(): Promise<string[]> {
  const categories = await getAllServiceCategories()
  return categories.map(cat => cat.categoryId)
}

/**
 * Creates a category labels map (categoryId -> label)
 */
export async function getCategoryLabelsMap(): Promise<Record<string, string>> {
  const categories = await getAllServiceCategories()
  const labelsMap: Record<string, string> = {}
  
  categories.forEach(cat => {
    labelsMap[cat.categoryId] = cat.label
  })
  
  return labelsMap
}

/**
 * Clears the categories cache (useful for testing or forcing refresh)
 */
export function clearCategoriesCache(): void {
  categoriesCache = null
  cacheTimestamp = 0
}
