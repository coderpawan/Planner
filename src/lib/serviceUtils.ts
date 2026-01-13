import { getAllServiceCategories as fetchCategories } from './firestore-services'

export interface ServiceCategory {
	slug: string
	name: string
	description: string
}

// Cache for service categories
let serviceCategoriesCache: Record<string, ServiceCategory> = {}
let isCacheInitialized = false

/**
 * Initialize categories cache from Firestore
 */
async function initializeCategoriesCache(): Promise<void> {
	if (isCacheInitialized) return
	
	const categories = await fetchCategories()
	
	categories.forEach(cat => {
		serviceCategoriesCache[cat.categoryId] = {
			slug: cat.categoryId,
			name: cat.label,
			description: '' // Description not stored in Firestore collection
		}
	})
	
	isCacheInitialized = true
}

export async function mapServiceSlugToCategory(slug: string): Promise<ServiceCategory | null> {
	await initializeCategoriesCache()
	return serviceCategoriesCache[slug] || null
}

export async function getAllServiceCategories(): Promise<ServiceCategory[]> {
	await initializeCategoriesCache()
	return Object.values(serviceCategoriesCache)
}
