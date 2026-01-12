import { doc, getDoc } from 'firebase/firestore'
import { firestore } from './firebase-config'

export interface VendorProfile {
  businessName: string
  ownerName: string
  phoneNumber: string
  alternativePhoneNumber: string
  email: string
  yearsOfExperience: number
  serviceCategories: string[]
  cities: Array<{ city: string; state: string }>
}

export async function getVendorProfile(vendorId: string): Promise<VendorProfile | null> {
  try {
    const vendorRef = doc(firestore, 'VerifiedVendors', vendorId)
    const vendorSnap = await getDoc(vendorRef)
    
    if (!vendorSnap.exists()) {
      return null
    }
    
    return vendorSnap.data() as VendorProfile
  } catch (error) {
    console.error('Error fetching vendor profile:', error)
    throw error
  }
}
