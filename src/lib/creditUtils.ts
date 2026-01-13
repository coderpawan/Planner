import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { firestore } from './firebase-config';
import { logUserEngagement } from './firestore-engagements';
import { VendorServiceDoc } from './firestore-utils';

export interface UserRole {
  role: 'user' | 'vendor' | 'admin';
}

export interface UserCredits {
  credits: number;
}

export interface UnlockedServicesDoc {
  services: string[];
}

/**
 * Initialize credits for a first-time user
 * Sets 5 credits in Firestore
 */
export async function initializeUserCredits(uid: string): Promise<void> {
  try {
    // Set in Firestore (Users collection - capitalized to match existing auth)
    const userDocRef = doc(firestore, 'Users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Only initialize if user doesn't exist
      await setDoc(userDocRef, {
        uid,
        credits: 5,
        createdAt: serverTimestamp()
      }, { merge: true });
    }

    // Initialize unlocked_services collection
    const unlockedServicesDocRef = doc(firestore, 'unlocked_services', uid);
    const unlockedServicesDoc = await getDoc(unlockedServicesDocRef);
    
    if (!unlockedServicesDoc.exists()) {
      await setDoc(unlockedServicesDocRef, {
        services: []
      });
    }
  } catch (error) {
    console.error('Error initializing user credits:', error);
    throw error;
  }
}

/**
 * Get user's current credits from Firestore
 */
export async function getUserCredits(uid: string): Promise<number> {
  try {
    const userDocRef = doc(firestore, 'Users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.credits ?? 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
}

/**
 * Get user's unlocked services
 */
export async function getUnlockedServices(uid: string): Promise<string[]> {
  try {
    const unlockedServicesDocRef = doc(firestore, 'unlocked_services', uid);
    const unlockedServicesDoc = await getDoc(unlockedServicesDocRef);
    
    if (unlockedServicesDoc.exists()) {
      const data = unlockedServicesDoc.data();
      return data.services ?? [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting unlocked services:', error);
    return [];
  }
}

/**
 * Subscribe to real-time credit updates from Firestore
 */
export function subscribeToCredits(
  uid: string,
  callback: (credits: number) => void
): () => void {
  const userDocRef = doc(firestore, 'Users', uid);
  
  console.log('🔹 subscribeToCredits: Setting up Firestore listener for:', uid);
  
  const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const credits = data.credits ?? 0;
      console.log('🔹 subscribeToCredits: Received data from Firestore:', credits);
      callback(credits);
    } else {
      console.log('🔸 subscribeToCredits: No data found in Firestore for:', uid);
      callback(0);
    }
  }, (error) => {
    console.error('🔴 subscribeToCredits: Error in Firestore listener:', error);
    callback(0);
  });

  // Return cleanup function
  return unsubscribe;
}

/**
 * Check if user can view contact details
 * Admin and Vendor roles have unlimited access
 * Regular users need credits or to have already unlocked the service
 */
export async function canViewContact(
  uid: string | null,
  serviceId: string,
  role: string | null
): Promise<{ canView: boolean; reason: string }> {
  // Not logged in
  if (!uid) {
    return { canView: false, reason: 'login_required' };
  }

  // Only Admin has unlimited access
  if (role === 'Admin') {
    return { canView: true, reason: 'role_exempted' };
  }

  // Check if service is already unlocked
  const unlockedServices = await getUnlockedServices(uid);
  if (unlockedServices.includes(serviceId)) {
    return { canView: true, reason: 'already_unlocked' };
  }

  // Check if user has credits
  const credits = await getUserCredits(uid);
  if (credits > 0) {
    return { canView: true, reason: 'has_credits' };
  }

  return { canView: false, reason: 'no_credits' };
}

/**
 * Deduct 1 credit from user and unlock a service
 * Updates Firestore only
 * Logs user engagement if role is "user" or "vendor"
 */
export async function deductCredit(
  uid: string, 
  serviceId: string,
  service?: Partial<VendorServiceDoc>,
  userName?: string,
  userPhone?: string,
  userRole?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current credits from Firestore
    const userDocRef = doc(firestore, 'Users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();
    const currentCredits = userData.credits ?? 0;

    // Get unlocked services from unlocked_services collection
    const unlockedServicesDocRef = doc(firestore, 'unlocked_services', uid);
    const unlockedServicesDoc = await getDoc(unlockedServicesDocRef);
    
    let unlockedServices: string[] = [];
    if (unlockedServicesDoc.exists()) {
      unlockedServices = unlockedServicesDoc.data().services ?? [];
    }

    // Check if already unlocked
    if (unlockedServices.includes(serviceId)) {
      return { success: true, message: 'Service already unlocked' };
    }

    // Check if has credits
    if (currentCredits <= 0) {
      return { success: false, message: 'Not enough credits' };
    }

    // Deduct credit and add to unlocked services
    const newCredits = currentCredits - 1;
    const newUnlockedServices = [...unlockedServices, serviceId];

    // Update credits in Firestore (Users collection)
    await updateDoc(userDocRef, {
      credits: newCredits
    });

    // Update unlocked services in unlocked_services collection
    await setDoc(unlockedServicesDocRef, {
      services: newUnlockedServices
    });

    // 🎯 LOG USER ENGAGEMENT (if not Admin)
    if (service && userRole && (userRole === 'User' || userRole === 'Vendor')) {
      // Get user details from userData or fallback to params
      const finalUserName = userName || userData.name || 'Interested User';
      const finalUserPhone = userPhone || userData.phoneNumber || '';
      const finalUserRole = userRole as 'User' | 'Vendor' | 'Admin';

      // Log engagement asynchronously (non-blocking)
      if (service.vendorId) {
        logUserEngagement(
          service.vendorId,
          service,
          uid,
          finalUserName,
          finalUserPhone,
          finalUserRole
        ).catch(err => {
          console.error('Non-blocking engagement logging error:', err);
        });
      }
    }

    return { success: true, message: '1 credit used successfully' };
  } catch (error) {
    console.error('Error deducting credit:', error);
    return { success: false, message: 'Failed to deduct credit' };
  }
}

/**
 * Check if a service is unlocked for the user
 */
export async function isServiceUnlocked(uid: string, serviceId: string): Promise<boolean> {
  try {
    const unlockedServices = await getUnlockedServices(uid);
    return unlockedServices.includes(serviceId);
  } catch (error) {
    console.error('Error checking if service is unlocked:', error);
    return false;
  }
}
