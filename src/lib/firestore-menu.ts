import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from './firebase-config'
import { MenuDataItem } from './menuUtils'

/**
 * Fetch menu items from Firestore
 * Fetches all menu items and caches them for filtering on client side
 */
export async function fetchMenuItems(): Promise<MenuDataItem[]> {
  try {
    const menuCollection = collection(firestore, 'menu')
    const snapshot = await getDocs(menuCollection)
    
    const items: MenuDataItem[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      items.push({
        category: data.category,
        name: data.name,
        image: data.image,
      })
    })
    
    return items
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return []
  }
}

/**
 * Filter menu items by category
 */
export function filterMenuByCategory(
  items: MenuDataItem[],
  category: 'services' | 'budget' | 'ideas'
): MenuDataItem[] {
  return items.filter(item => item.category === category)
}
