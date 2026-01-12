/**
 * Wedding Budget Configuration
 * Defines budget ranges, service category rules, pricing limits, and visibility
 * Each category has ONE canonical pricing unit for fair comparisons
 */

export type CanonicalPricingUnit =
  | 'per_day'
  | 'per_event'
  | 'per_plate'
  | 'per_person'
  | 'per_hour'
  | 'per_vehicle_per_day'
  | 'per_piece'
  | 'full_wedding'

export type ServiceCategory = 
  | 'venue'
  | 'wedding_planner'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'makeup_styling'
  | 'music_entertainment'
  | 'choreography'
  | 'ritual_services'
  | 'wedding_transport'
  | 'invitations_gifting'

export type ServiceVisibility = 'KEEP' | 'OPTIONAL'

export type BudgetRange = 'under-4-lakh' | '4-8-lakh' | '8-20-lakh' | '20-lakh-plus'

export interface ServiceCategoryRule {
  category: ServiceCategory
  displayName: string
  canonicalUnit: CanonicalPricingUnit
  minPrice: number
  maxPrice: number
  visibility: ServiceVisibility
  description: string
}

export interface BudgetConfig {
  range: BudgetRange
  displayRange: string
  minBudget: number
  maxBudget: number | null // null means no upper limit
  description: string
  services: ServiceCategoryRule[]
}

// Canonical pricing unit by category (SINGLE SOURCE OF TRUTH)
export const CANONICAL_UNIT_BY_CATEGORY: Record<ServiceCategory, CanonicalPricingUnit> = {
  venue: 'per_day',
  wedding_planner: 'full_wedding',
  catering: 'per_plate',
  decor: 'per_event',
  photography: 'full_wedding',
  makeup_styling: 'per_person',
  music_entertainment: 'per_hour',
  choreography: 'per_event',
  ritual_services: 'per_event',
  wedding_transport: 'per_vehicle_per_day',
  invitations_gifting: 'per_piece'
}

// Category display names
export const categoryDisplayNames: Record<ServiceCategory, string> = {
  venue: 'Venue',
  wedding_planner: 'Wedding Planner',
  catering: 'Catering',
  decor: 'Decor',
  photography: 'Photography & Videography',
  makeup_styling: 'Makeup & Styling',
  music_entertainment: 'Music & Entertainment',
  choreography: 'Choreography',
  ritual_services: 'Ritual Services',
  wedding_transport: 'Wedding Transport',
  invitations_gifting: 'Invitations & Gifting'
}

// Budget configuration for each range
export const WEDDING_BUDGET_CONFIG: Record<BudgetRange, BudgetConfig> = {
  'under-4-lakh': {
    range: 'under-4-lakh',
    displayRange: 'under–4 Lakh',
    minBudget: 100000,
    maxBudget: 400000,
    description: 'Simple & Beautiful Celebrations',
    services: [
      {
        category: 'venue',
        displayName: categoryDisplayNames.venue,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.venue,
        minPrice: 0,
        maxPrice: 150000,
        visibility: 'KEEP',
        description: 'Intimate venues for small gatherings'
      },
      {
        category: 'catering',
        displayName: categoryDisplayNames.catering,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.catering,
        minPrice: 0,
        maxPrice: 500,
        visibility: 'KEEP',
        description: 'Budget-friendly catering options'
      },
      {
        category: 'photography',
        displayName: categoryDisplayNames.photography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.photography,
        minPrice: 0,
        maxPrice: 50000,
        visibility: 'KEEP',
        description: 'Essential photography and videography'
      },
      {
        category: 'decor',
        displayName: categoryDisplayNames.decor,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.decor,
        minPrice: 0,
        maxPrice: 40000,
        visibility: 'OPTIONAL',
        description: 'Simple and elegant decoration'
      },
      {
        category: 'makeup_styling',
        displayName: categoryDisplayNames.makeup_styling,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.makeup_styling,
        minPrice: 0,
        maxPrice: 250,
        visibility: 'OPTIONAL',
        description: 'Professional makeup services'
      },
      {
        category: 'music_entertainment',
        displayName: categoryDisplayNames.music_entertainment,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.music_entertainment,
        minPrice: 0,
        maxPrice: 2500,
        visibility: 'OPTIONAL',
        description: 'DJ or live music entertainment'
      },
      {
        category: 'wedding_planner',
        displayName: categoryDisplayNames.wedding_planner,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_planner,
        minPrice: 0,
        maxPrice: 80000,
        visibility: 'OPTIONAL',
        description: 'Professional wedding planning assistance'
      },
      {
        category: 'choreography',
        displayName: categoryDisplayNames.choreography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.choreography,
        minPrice: 0,
        maxPrice: 15000,
        visibility: 'OPTIONAL',
        description: 'Dance choreography for sangeet'
      },
      {
        category: 'ritual_services',
        displayName: categoryDisplayNames.ritual_services,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.ritual_services,
        minPrice: 0,
        maxPrice: 20000,
        visibility: 'OPTIONAL',
        description: 'Pandit and ritual services'
      },
      {
        category: 'invitations_gifting',
        displayName: categoryDisplayNames.invitations_gifting,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.invitations_gifting,
        minPrice: 0,
        maxPrice: 100,
        visibility: 'OPTIONAL',
        description: 'Wedding invitations and gifts'
      },
      {
        category: 'wedding_transport',
        displayName: categoryDisplayNames.wedding_transport,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_transport,
        minPrice: 0,
        maxPrice: 10000,
        visibility: 'OPTIONAL',
        description: 'Transportation for guests and family'
      }
    ]
  },

  '4-8-lakh': {
    range: '4-8-lakh',
    displayRange: '₹4–8 Lakh',
    minBudget: 400000,
    maxBudget: 800000,
    description: 'Elegant Weddings for Every Family',
    services: [
      {
        category: 'venue',
        displayName: categoryDisplayNames.venue,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.venue,
        minPrice: 100000,
        maxPrice: 300000,
        visibility: 'KEEP',
        description: 'Mid-size venues with good amenities'
      },
      {
        category: 'catering',
        displayName: categoryDisplayNames.catering,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.catering,
        minPrice: 350,
        maxPrice: 800,
        visibility: 'KEEP',
        description: 'Quality catering with variety'
      },
      {
        category: 'photography',
        displayName: categoryDisplayNames.photography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.photography,
        minPrice: 40000,
        maxPrice: 100000,
        visibility: 'KEEP',
        description: 'Professional photography and videography'
      },
      {
        category: 'decor',
        displayName: categoryDisplayNames.decor,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.decor,
        minPrice: 30000,
        maxPrice: 80000,
        visibility: 'KEEP',
        description: 'Beautiful themed decoration'
      },
      {
        category: 'makeup_styling',
        displayName: categoryDisplayNames.makeup_styling,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.makeup_styling,
        minPrice: 150,
        maxPrice: 500,
        visibility: 'OPTIONAL',
        description: 'Professional bridal makeup'
      },
      {
        category: 'music_entertainment',
        displayName: categoryDisplayNames.music_entertainment,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.music_entertainment,
        minPrice: 2500,
        maxPrice: 5000,
        visibility: 'OPTIONAL',
        description: 'Live band or premium DJ'
      },
      {
        category: 'wedding_planner',
        displayName: categoryDisplayNames.wedding_planner,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_planner,
        minPrice: 60000,
        maxPrice: 150000,
        visibility: 'OPTIONAL',
        description: 'Full-service wedding planning'
      },
      {
        category: 'choreography',
        displayName: categoryDisplayNames.choreography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.choreography,
        minPrice: 10000,
        maxPrice: 30000,
        visibility: 'OPTIONAL',
        description: 'Professional dance choreography'
      },
      {
        category: 'ritual_services',
        displayName: categoryDisplayNames.ritual_services,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.ritual_services,
        minPrice: 10000,
        maxPrice: 35000,
        visibility: 'OPTIONAL',
        description: 'Traditional ceremony services'
      },
      {
        category: 'invitations_gifting',
        displayName: categoryDisplayNames.invitations_gifting,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.invitations_gifting,
        minPrice: 50,
        maxPrice: 200,
        visibility: 'OPTIONAL',
        description: 'Designer invitations and gifts'
      },
      {
        category: 'wedding_transport',
        displayName: categoryDisplayNames.wedding_transport,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_transport,
        minPrice: 5000,
        maxPrice: 15000,
        visibility: 'OPTIONAL',
        description: 'Comfortable guest transportation'
      }
    ]
  },

  '8-20-lakh': {
    range: '8-20-lakh',
    displayRange: '₹8–20 Lakh',
    minBudget: 800000,
    maxBudget: 2000000,
    description: 'Grand Yet Affordable Options',
    services: [
      {
        category: 'venue',
        displayName: categoryDisplayNames.venue,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.venue,
        minPrice: 200000,
        maxPrice: 1000000,
        visibility: 'KEEP',
        description: 'Premium banquet halls and gardens'
      },
      {
        category: 'catering',
        displayName: categoryDisplayNames.catering,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.catering,
        minPrice: 600,
        maxPrice: 1500,
        visibility: 'KEEP',
        description: 'Premium multi-cuisine catering'
      },
      {
        category: 'photography',
        displayName: categoryDisplayNames.photography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.photography,
        minPrice: 80000,
        maxPrice: 250000,
        visibility: 'KEEP',
        description: 'Cinematic photography and videography'
      },
      {
        category: 'decor',
        displayName: categoryDisplayNames.decor,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.decor,
        minPrice: 60000,
        maxPrice: 300000,
        visibility: 'KEEP',
        description: 'Grand themed decoration'
      },
      {
        category: 'makeup_styling',
        displayName: categoryDisplayNames.makeup_styling,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.makeup_styling,
        minPrice: 350,
        maxPrice: 1000,
        visibility: 'KEEP',
        description: 'Premium bridal makeup and styling'
      },
      {
        category: 'music_entertainment',
        displayName: categoryDisplayNames.music_entertainment,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.music_entertainment,
        minPrice: 5000,
        maxPrice: 10000,
        visibility: 'OPTIONAL',
        description: 'Live entertainment and celebrity DJs'
      },
      {
        category: 'wedding_planner',
        displayName: categoryDisplayNames.wedding_planner,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_planner,
        minPrice: 120000,
        maxPrice: 300000,
        visibility: 'OPTIONAL',
        description: 'Premium wedding planning services'
      },
      {
        category: 'choreography',
        displayName: categoryDisplayNames.choreography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.choreography,
        minPrice: 25000,
        maxPrice: 80000,
        visibility: 'OPTIONAL',
        description: 'Celebrity choreographer services'
      },
      {
        category: 'ritual_services',
        displayName: categoryDisplayNames.ritual_services,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.ritual_services,
        minPrice: 20000,
        maxPrice: 60000,
        visibility: 'OPTIONAL',
        description: 'Specialized ritual services'
      },
      {
        category: 'invitations_gifting',
        displayName: categoryDisplayNames.invitations_gifting,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.invitations_gifting,
        minPrice: 150,
        maxPrice: 500,
        visibility: 'OPTIONAL',
        description: 'Premium designer invitations'
      },
      {
        category: 'wedding_transport',
        displayName: categoryDisplayNames.wedding_transport,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_transport,
        minPrice: 10000,
        maxPrice: 30000,
        visibility: 'OPTIONAL',
        description: 'Luxury transportation services'
      }
    ]
  },

  '20-lakh-plus': {
    range: '20-lakh-plus',
    displayRange: '₹20 Lakh+',
    minBudget: 2000000,
    maxBudget: null,
    description: 'Premium & Luxury Experiences',
    services: [
      {
        category: 'venue',
        displayName: categoryDisplayNames.venue,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.venue,
        minPrice: 800000,
        maxPrice: 999999999,
        visibility: 'KEEP',
        description: 'Luxury resorts and destination venues'
      },
      {
        category: 'catering',
        displayName: categoryDisplayNames.catering,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.catering,
        minPrice: 1200,
        maxPrice: 999999999,
        visibility: 'KEEP',
        description: 'Gourmet catering with celebrity chefs'
      },
      {
        category: 'photography',
        displayName: categoryDisplayNames.photography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.photography,
        minPrice: 200000,
        maxPrice: 999999999,
        visibility: 'KEEP',
        description: 'Celebrity photographers and filmmakers'
      },
      {
        category: 'decor',
        displayName: categoryDisplayNames.decor,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.decor,
        minPrice: 250000,
        maxPrice: 999999999,
        visibility: 'KEEP',
        description: 'Luxury designer decoration'
      },
      {
        category: 'makeup_styling',
        displayName: categoryDisplayNames.makeup_styling,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.makeup_styling,
        minPrice: 800,
        maxPrice: 10000,
        visibility: 'KEEP',
        description: 'Celebrity makeup artists'
      },
      {
        category: 'music_entertainment',
        displayName: categoryDisplayNames.music_entertainment,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.music_entertainment,
        minPrice: 10000,
        maxPrice: 999999999,
        visibility: 'KEEP',
        description: 'Celebrity performers and international artists'
      },
      {
        category: 'wedding_planner',
        displayName: categoryDisplayNames.wedding_planner,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_planner,
        minPrice: 250000,
        maxPrice: 999999999,
        visibility: 'OPTIONAL',
        description: 'Luxury wedding planning and coordination'
      },
      {
        category: 'choreography',
        displayName: categoryDisplayNames.choreography,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.choreography,
        minPrice: 60000,
        maxPrice: 999999999,
        visibility: 'OPTIONAL',
        description: 'Bollywood choreographers'
      },
      {
        category: 'ritual_services',
        displayName: categoryDisplayNames.ritual_services,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.ritual_services,
        minPrice: 50000,
        maxPrice: 999999999,
        visibility: 'OPTIONAL',
        description: 'Premium ritual and astrology services'
      },
      {
        category: 'invitations_gifting',
        displayName: categoryDisplayNames.invitations_gifting,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.invitations_gifting,
        minPrice: 400,
        maxPrice: 999999999,
        visibility: 'OPTIONAL',
        description: 'Luxury bespoke invitations'
      },
      {
        category: 'wedding_transport',
        displayName: categoryDisplayNames.wedding_transport,
        canonicalUnit: CANONICAL_UNIT_BY_CATEGORY.wedding_transport,
        minPrice: 25000,
        maxPrice: 999999999,
        visibility: 'OPTIONAL',
        description: 'Luxury cars and exotic transportation'
      }
    ]
  }
}

/**
 * Get budget configuration by budget range
 */
export function getBudgetConfig(budgetRange: BudgetRange): BudgetConfig {
  return WEDDING_BUDGET_CONFIG[budgetRange]
}

/**
 * Get all priority (KEEP) services for a budget range
 */
export function getPriorityServices(budgetRange: BudgetRange): ServiceCategoryRule[] {
  const config = getBudgetConfig(budgetRange)
  return config.services.filter(service => service.visibility === 'KEEP')
}

/**
 * Get all optional services for a budget range
 */
export function getOptionalServices(budgetRange: BudgetRange): ServiceCategoryRule[] {
  const config = getBudgetConfig(budgetRange)
  return config.services.filter(service => service.visibility === 'OPTIONAL')
}

/**
 * Check if a service is eligible based on strict canonical unit matching
 */
export function isServiceEligible(
  servicePrice: number,
  serviceUnit: string,
  rule: ServiceCategoryRule
): boolean {
  return (
    serviceUnit === rule.canonicalUnit &&
    servicePrice >= rule.minPrice &&
    servicePrice <= rule.maxPrice
  )
}

/**
 * Check if a service price is within the allowed range for a category
 * @deprecated Use isServiceEligible instead
 */
export function isPriceInRange(
  price: number,
  categoryRule: ServiceCategoryRule
): boolean {
  return price >= categoryRule.minPrice && price <= categoryRule.maxPrice
}

/**
 * Check if a pricing unit matches the canonical unit for a category
 * @deprecated Use isServiceEligible instead
 */
export function isPricingUnitAllowed(
  pricingUnit: string,
  categoryRule: ServiceCategoryRule
): boolean {
  return pricingUnit === categoryRule.canonicalUnit
}

/**
 * Normalize Firestore category name to config category name
 * Firestore and Config categories now match 1:1
 */
export function normalizeFirestoreCategoryToConfig(firestoreCategory: string): ServiceCategory | null {
  const mapping: Record<string, ServiceCategory> = {
    'venue': 'venue',
    'wedding_planner': 'wedding_planner',
    'catering': 'catering',
    'decor': 'decor',
    'photography': 'photography',
    'makeup_styling': 'makeup_styling',
    'music_entertainment': 'music_entertainment',
    'choreography': 'choreography',
    'ritual_services': 'ritual_services',
    'wedding_transport': 'wedding_transport',
    'invitations_gifting': 'invitations_gifting'
  }
  
  return mapping[firestoreCategory] || null
}

/**
 * Convert pricing unit to human-readable format
 */
export function formatPricingUnit(unit: CanonicalPricingUnit | string): string {
  const formatMap: Record<CanonicalPricingUnit, string> = {
    'per_day': 'per day',
    'per_event': 'per event',
    'per_plate': 'per plate',
    'per_person': 'per person',
    'per_hour': 'per hour',
    'per_vehicle_per_day': 'per vehicle per day',
    'per_piece': 'per piece',
    'full_wedding': 'full wedding package'
  }
  
  return formatMap[unit as CanonicalPricingUnit] || unit
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)}L`
  } else if (price >= 1000) {
    return `₹${(price / 1000).toFixed(1)}K`
  }
  return `₹${price}`
}
