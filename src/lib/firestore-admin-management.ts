import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from './firebase-config';

// Type Definitions
export interface UserData {
  uid: string;
  name: string;
  phoneNumber: string;
  role: 'User' | 'Vendor' | 'Admin';
  createdAt?: Timestamp;
}

export interface AdminData {
  uid: string;
  name: string;
  phoneNumber: string;
  active: boolean;
  promotedBy: string;
  promotedByName: string;
  promotedAt: Timestamp;
  demotedBy?: string;
  demotedByName?: string;
  demotedAt?: Timestamp;
}

export interface AdminAuditLog {
  targetUserId: string;
  targetPhoneNumber: string;
  action: 'PROMOTE_TO_ADMIN' | 'DEMOTE_FROM_ADMIN' | 'ACTIVATE_ADMIN' | 'DEACTIVATE_ADMIN';
  performedByAdminId: string;
  performedByAdminName: string;
  performedAt: Timestamp;
}

export interface SearchResult {
  user: UserData;
  admin: AdminData | null;
  isAdmin: boolean;
}

/**
 * Normalize phone number to E.164 format
 * This is a basic implementation - adjust based on your requirements
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with country code, use as is
  // Otherwise, assume it needs +91 prefix (adjust for your region)
  if (digits.startsWith('91') && digits.length === 12) {
    return '+' + digits;
  } else if (digits.length === 10) {
    return '+91' + digits;
  } else if (digits.startsWith('+')) {
    return digits;
  }
  
  return '+' + digits;
}

/**
 * Search for user by phone number
 * First checks Admins collection, then Users collection
 */
export async function searchUserByPhoneNumber(
  phoneNumber: string
): Promise<SearchResult | null> {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Step 1: Check Admins collection
    const adminsQuery = query(
      collection(firestore, 'Admins'),
      where('phoneNumber', '==', normalizedPhone)
    );
    const adminsSnapshot = await getDocs(adminsQuery);
    
    if (!adminsSnapshot.empty) {
      // Admin found
      const adminDoc = adminsSnapshot.docs[0];
      const adminData = { uid: adminDoc.id, ...adminDoc.data() } as AdminData;
      
      // Fetch corresponding User document
      const userDoc = await getDoc(doc(firestore, 'Users', adminDoc.id));
      if (userDoc.exists()) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserData;
        return {
          user: userData,
          admin: adminData,
          isAdmin: true,
        };
      }
    }
    
    // Step 2: Check Users collection
    const usersQuery = query(
      collection(firestore, 'Users'),
      where('phoneNumber', '==', normalizedPhone)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      // User found
      const userDoc = usersSnapshot.docs[0];
      const userData = { uid: userDoc.id, ...userDoc.data() } as UserData;
      
      // Check if there's any historical admin data (they might have been demoted)
      const adminDoc = await getDoc(doc(firestore, 'Admins', userDoc.id));
      const adminData = adminDoc.exists()
        ? ({ uid: adminDoc.id, ...adminDoc.data() } as AdminData)
        : null;
      
      return {
        user: userData,
        admin: adminData,
        isAdmin: userData.role === 'Admin',
      };
    }
    
    // No user found
    return null;
  } catch (error) {
    console.error('Error searching user by phone number:', error);
    throw error;
  }
}

/**
 * Promote a user to admin
 * Atomically updates Users collection, creates Admin document, and logs the action
 */
export async function promoteUserToAdmin(
  targetUserId: string,
  targetUserData: UserData,
  performedByAdminId: string,
  performedByAdminName: string
): Promise<void> {
  try {
    console.log('Promoting user to admin:', {
      targetUserId,
      targetUserName: targetUserData.name,
      performedBy: performedByAdminName,
    });
    
    const batch = writeBatch(firestore);
    
    // 1. Update Users collection - set role to Admin
    const userRef = doc(firestore, 'Users', targetUserId);
    batch.update(userRef, {
      role: 'Admin',
    });
    
    // 2. Create Admins document
    const adminRef = doc(firestore, 'Admins', targetUserId);
    batch.set(adminRef, {
      name: targetUserData.name,
      phoneNumber: targetUserData.phoneNumber,
      active: true,
      promotedBy: performedByAdminId,
      promotedByName: performedByAdminName,
      promotedAt: serverTimestamp(),
    });
    
    // 3. Create audit log
    const auditLogRef = doc(collection(firestore, 'AdminAuditLogs'));
    batch.set(auditLogRef, {
      targetUserId,
      targetPhoneNumber: targetUserData.phoneNumber,
      action: 'PROMOTE_TO_ADMIN',
      performedByAdminId,
      performedByAdminName,
      performedAt: serverTimestamp(),
    });
    
    // Commit atomic batch
    await batch.commit();
    console.log('User successfully promoted to admin:', targetUserId);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
}

/**
 * Demote an admin to user
 * Atomically updates Users collection, updates then deletes Admin document, and logs the action
 */
export async function demoteAdminToUser(
  targetUserId: string,
  targetUserData: UserData,
  performedByAdminId: string,
  performedByAdminName: string
): Promise<void> {
  try {
    console.log('Demoting admin to user:', {
      targetUserId,
      targetUserName: targetUserData.name,
      performedBy: performedByAdminName,
    });
    
    // First, update the Admin document with demotion info (for audit trail)
    const adminRef = doc(firestore, 'Admins', targetUserId);
    await updateDoc(adminRef, {
      active: false,
      demotedBy: performedByAdminId,
      demotedByName: performedByAdminName,
      demotedAt: serverTimestamp(),
    });
    
    // Then perform batch operations
    const batch = writeBatch(firestore);
    
    // 1. Update Users collection - set role to User
    const userRef = doc(firestore, 'Users', targetUserId);
    batch.update(userRef, {
      role: 'User',
    });
    
    // 2. Delete Admins document (already marked as inactive above)
    // Note: We updated it first to keep a record before deletion
    batch.delete(adminRef);
    
    // 3. Create audit log
    const auditLogRef = doc(collection(firestore, 'AdminAuditLogs'));
    batch.set(auditLogRef, {
      targetUserId,
      targetPhoneNumber: targetUserData.phoneNumber,
      action: 'DEMOTE_FROM_ADMIN',
      performedByAdminId,
      performedByAdminName,
      performedAt: serverTimestamp(),
    });
    
    // Commit atomic batch
    await batch.commit();
    console.log('Admin successfully demoted to user:', targetUserId);
  } catch (error) {
    console.error('Error demoting admin to user:', error);
    throw error;
  }
}

/**
 * Check if a user can perform admin management actions
 * (e.g., prevent self-demotion or self-deactivation)
 */
export function canPerformAction(
  performerUid: string,
  targetUid: string,
  action: 'PROMOTE' | 'DEMOTE' | 'ACTIVATE' | 'DEACTIVATE'
): { allowed: boolean; reason?: string } {
  // Cannot demote or deactivate yourself
  if ((action === 'DEMOTE' || action === 'DEACTIVATE') && performerUid === targetUid) {
    return {
      allowed: false,
      reason: action === 'DEMOTE' ? 'You cannot demote yourself' : 'You cannot deactivate yourself',
    };
  }
  
  return { allowed: true };
}

/**
 * Activate an admin
 * Updates the Admin document's active status and creates audit log
 */
export async function activateAdmin(
  targetUserId: string,
  targetUserData: UserData,
  performedByAdminId: string,
  performedByAdminName: string
): Promise<void> {
  try {
    console.log('Activating admin:', {
      targetUserId,
      targetUserName: targetUserData.name,
      performedBy: performedByAdminName,
    });
    
    const batch = writeBatch(firestore);
    
    // 1. Update Admins document - set active to true
    const adminRef = doc(firestore, 'Admins', targetUserId);
    batch.update(adminRef, {
      active: true,
    });
    
    // 2. Create audit log
    const auditLogRef = doc(collection(firestore, 'AdminAuditLogs'));
    batch.set(auditLogRef, {
      targetUserId,
      targetPhoneNumber: targetUserData.phoneNumber,
      action: 'ACTIVATE_ADMIN',
      performedByAdminId,
      performedByAdminName,
      performedAt: serverTimestamp(),
    });
    
    // Commit atomic batch
    await batch.commit();
    console.log('Admin successfully activated:', targetUserId);
  } catch (error) {
    console.error('Error activating admin:', error);
    throw error;
  }
}

/**
 * Deactivate an admin
 * Updates the Admin document's active status and creates audit log
 */
export async function deactivateAdmin(
  targetUserId: string,
  targetUserData: UserData,
  performedByAdminId: string,
  performedByAdminName: string
): Promise<void> {
  try {
    console.log('Deactivating admin:', {
      targetUserId,
      targetUserName: targetUserData.name,
      performedBy: performedByAdminName,
    });
    
    const batch = writeBatch(firestore);
    
    // 1. Update Admins document - set active to false
    const adminRef = doc(firestore, 'Admins', targetUserId);
    batch.update(adminRef, {
      active: false,
    });
    
    // 2. Create audit log
    const auditLogRef = doc(collection(firestore, 'AdminAuditLogs'));
    batch.set(auditLogRef, {
      targetUserId,
      targetPhoneNumber: targetUserData.phoneNumber,
      action: 'DEACTIVATE_ADMIN',
      performedByAdminId,
      performedByAdminName,
      performedAt: serverTimestamp(),
    });
    
    // Commit atomic batch
    await batch.commit();
    console.log('Admin successfully deactivated:', targetUserId);
  } catch (error) {
    console.error('Error deactivating admin:', error);
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string
): Promise<AdminAuditLog[]> {
  try {
    const logsQuery = query(
      collection(firestore, 'AdminAuditLogs'),
      where('targetUserId', '==', userId)
    );
    
    const logsSnapshot = await getDocs(logsQuery);
    const logs: AdminAuditLog[] = [];
    
    logsSnapshot.forEach((doc) => {
      logs.push(doc.data() as AdminAuditLog);
    });
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => {
      const timeA = a.performedAt?.toMillis() || 0;
      const timeB = b.performedAt?.toMillis() || 0;
      return timeB - timeA;
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}
