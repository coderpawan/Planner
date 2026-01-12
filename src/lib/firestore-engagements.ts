/**
 * Firestore User Engagement Utilities
 * Tracks when users unlock vendor services
 */

import { 
  doc, 
  getDoc, 
  setDoc,
  arrayUnion,
  Timestamp
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { VendorServiceDoc } from '@/lib/firestore-utils'

/**
 * User Engagement Schema
 * Stored in: user_engagements/{vendorId}/engagements (array field)
 */
export interface UserEngagement {
  engagementId: string            // `${serviceId}_${userId}`
  
  // Service info
  serviceId: string
  serviceName: string
  serviceCategory: string
  serviceCity: string

  // User who unlocked
  unlockedByUserId: string
  unlockedByName: string
  unlockedByPhoneNumber: string
  unlockedByRole: 'User' | 'Vendor'

  // Timestamp
  unlockedAt: Timestamp | any
}

/**
 * Log a user engagement when service contact details are unlocked
 * 
 * Business Rules:
 * - Only log if unlocking user is "user" or "vendor" (NOT admin)
 * - Only log if service belongs to another vendor
 * - Duplicate-proof using engagementId
 * - Should not block unlock flow if logging fails
 * 
 * @param serviceVendorId - The vendor who owns the service
 * @param service - The service being unlocked
 * @param userId - User ID unlocking the service
 * @param userName - User name
 * @param userPhone - User phone number
 * @param userRole - User role ("User" | "Vendor" | "Admin")
 */
export async function logUserEngagement(
  serviceVendorId: string,
  service: Partial<VendorServiceDoc>,
  userId: string,
  userName: string,
  userPhone: string,
  userRole: 'User' | 'Vendor' | 'Admin'
): Promise<void> {
  try {
    // CRITICAL: Only log for users and vendors (NOT admins)
    if (userRole === 'Admin') {
      console.log('⚠️ Engagement NOT logged: User is Admin');
      return;
    }

    // CRITICAL: Ensure service has a vendor
    if (!serviceVendorId || !service.vendorId) {
      console.log('⚠️ Engagement NOT logged: Service has no vendorId');
      return;
    }

    // Create engagement ID (composite key for duplicate prevention)
    const engagementId = `${service.serviceId}_${userId}`;

    // Get vendor engagement document
    const engagementDocRef = doc(firestore, 'user_engagements', serviceVendorId);
    const engagementDoc = await getDoc(engagementDocRef);
    
    // Check if engagement already exists in array
    const existingEngagements = engagementDoc.exists() ? (engagementDoc.data().engagements || []) : [];
    const alreadyExists = existingEngagements.some(
      (eng: UserEngagement) => eng.engagementId === engagementId
    );

    if (alreadyExists) {
      console.log('ℹ️ Engagement already logged for this user and service');
      return;
    }

    // Create engagement object
    const engagement: UserEngagement = {
      engagementId,
      
      // Service details
      serviceId: service.serviceId || '',
      serviceName: service.serviceName || 'Unknown Service',
      serviceCategory: service.serviceCategory || 'unknown',
      serviceCity: service.city || service.cityId || 'Unknown',

      // User details
      unlockedByUserId: userId,
      unlockedByName: userName || 'Interested User',
      unlockedByPhoneNumber: userPhone || '',
      unlockedByRole: userRole as 'User' | 'Vendor',

      // Timestamp
      unlockedAt: Timestamp.now()
    };

    // Add to engagements array using arrayUnion (creates document if it doesn't exist)
    await setDoc(engagementDocRef, {
      vendorId: serviceVendorId,
      engagements: arrayUnion(engagement)
    }, { merge: true });

    console.log('✅ User engagement logged:', engagementId);
  } catch (error) {
    // Log error but don't throw - engagement logging should NOT block unlock
    console.error('❌ Error logging engagement (non-blocking):', error);
  }
}

/**
 * Fetch all engagements for a vendor
 * 
 * @param vendorId - The vendor ID
 * @returns Array of engagements ordered by unlockedAt (newest first)
 */
export async function getVendorEngagements(vendorId: string): Promise<UserEngagement[]> {
  try {
    const engagementDocRef = doc(firestore, 'user_engagements', vendorId);
    const engagementDoc = await getDoc(engagementDocRef);
    
    if (!engagementDoc.exists()) {
      console.log('No engagements found for vendor');
      return [];
    }

    const engagements = engagementDoc.data().engagements || [];
    
    // Sort by unlockedAt (newest first)
    return engagements.sort((a: UserEngagement, b: UserEngagement) => {
      const aTime = a.unlockedAt?.toMillis ? a.unlockedAt.toMillis() : 0;
      const bTime = b.unlockedAt?.toMillis ? b.unlockedAt.toMillis() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error fetching vendor engagements:', error);
    return [];
  }
}

