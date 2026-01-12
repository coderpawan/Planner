export interface BudgetRange {
	min: number
	max: number
	label: string
}

export interface ServiceCity {
	id: string
	name: string
	state: string
}

export const BUDGET_RANGES: Record<string, BudgetRange> = {
	'1-3-lakh': { min: 100000, max: 300000, label: '₹1–3 Lakh' },
	'3-8-lakh': { min: 300000, max: 800000, label: '₹3–8 Lakh' },
	'8-20-lakh': { min: 800000, max: 2000000, label: '₹8–20 Lakh' },
	'20-lakh-plus': { min: 2000000, max: 10000000, label: '₹20 Lakh+' },
}

export const SERVICE_CITIES: ServiceCity[] = [
	{ id: '1', name: 'Mumbai', state: 'Maharashtra' },
	{ id: '2', name: 'Delhi', state: 'Delhi' },
	{ id: '3', name: 'Bangalore', state: 'Karnataka' },
	{ id: '4', name: 'Pune', state: 'Maharashtra' },
	{ id: '5', name: 'Hyderabad', state: 'Telangana' },
	{ id: '6', name: 'Chennai', state: 'Tamil Nadu' },
	{ id: '7', name: 'Kolkata', state: 'West Bengal' },
	{ id: '8', name: 'Ahmedabad', state: 'Gujarat' },
	{ id: '9', name: 'Jaipur', state: 'Rajasthan' },
	{ id: '10', name: 'Lucknow', state: 'Uttar Pradesh' },
]

export function mapBudgetSlugToRange(slug: string): BudgetRange | null {
	return BUDGET_RANGES[slug] || null
}

export function checkCityServiceAvailability(cityName: string): boolean {
	return SERVICE_CITIES.some(
		city => city.name.toLowerCase() === cityName.toLowerCase()
	)
}

export interface Vendor {
	id: string
	name: string
	category: string
	theme?: string
	city: string
	priceMin: number
	priceMax: number
	coverImage: string
	images: string[]
	isFeatured: boolean
	features: string[]
	description: string
	facilities: string[]
	contactPhone?: string
	contactEmail?: string
}

export function groupVendorsByCategory(vendors: Vendor[]): Record<string, Vendor[]> {
	return vendors.reduce((acc, vendor) => {
		if (!acc[vendor.category]) {
			acc[vendor.category] = []
		}
		acc[vendor.category].push(vendor)
		return acc
	}, {} as Record<string, Vendor[]>)
}

export function filterVendorsByBudgetAndCity(
	vendors: Vendor[],
	city: string,
	budgetRange: BudgetRange
): Vendor[] {
	return vendors.filter(vendor => {
		const matchesCity = vendor.city.toLowerCase() === city.toLowerCase()
		const matchesBudget = 
			vendor.priceMin <= budgetRange.max && 
			vendor.priceMax >= budgetRange.min
		return matchesCity && matchesBudget
	})
}

