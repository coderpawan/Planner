/**
 * Menu utilities for slug/title conversion
 */

export interface MenuDataItem {
  category: 'services' | 'budget' | 'ideas'
  name: string
  image: string
}

/**
 * Convert slug to human-readable title
 * Example: "under-4-lakh" -> "Under 4 Lakh"
 */
export function slugToTitle(slug: string): string {
  if (!slug) return ''
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert title to slug format
 * Example: "Punjabi Big Fat Wedding" -> "punjabi-big-fat-wedding"
 */
export function titleToSlug(title: string): string {
  if (!title) return ''
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
