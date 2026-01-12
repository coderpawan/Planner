import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { firestore } from './firebase-config';
import { useState, useEffect } from 'react';
import { getServiceByIdCityCategory } from './firestore-services';

export interface CartItem {
  serviceId: string;
  category: string;
  city: string;
  addedAt: any; // Firestore Timestamp
}

export interface CartData {
  [serviceId: string]: CartItem;
}

/**
 * Add a service to user's cart
 */
export async function addToCart(
  uid: string,
  serviceId: string,
  category: string,
  city: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!uid) {
      return { success: false, message: 'User not authenticated' };
    }

    const cartDocRef = doc(firestore, 'cart', uid);
    const cartDoc = await getDoc(cartDocRef);

    let cart: CartData = {};
    if (cartDoc.exists()) {
      cart = cartDoc.data() as CartData;
    }

    // Check if already in cart
    if (cart[serviceId]) {
      return { success: false, message: 'Already in cart' };
    }

    // Add to cart
    const cartItem: CartItem = {
      serviceId,
      category,
      city,
      addedAt: serverTimestamp()
    };

    await setDoc(cartDocRef, {
      ...cart,
      [serviceId]: cartItem
    });

    return { success: true, message: 'Added to cart' };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, message: 'Failed to add to cart' };
  }
}

/**
 * Remove a service from user's cart
 */
export async function removeFromCart(
  uid: string,
  serviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!uid) {
      return { success: false, message: 'User not authenticated' };
    }

    const cartDocRef = doc(firestore, 'cart', uid);
    const cartDoc = await getDoc(cartDocRef);

    if (!cartDoc.exists()) {
      return { success: false, message: 'Cart not found' };
    }

    const cart = cartDoc.data() as CartData;
    
    // Remove the service from cart object
    delete cart[serviceId];
    
    // Update the cart document
    await setDoc(cartDocRef, cart);

    return { success: true, message: 'Removed from cart' };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, message: 'Failed to remove from cart' };
  }
}

/**
 * Get user's cart data
 */
export async function getCart(uid: string): Promise<CartData> {
  try {
    if (!uid) return {};

    const cartDocRef = doc(firestore, 'cart', uid);
    const cartDoc = await getDoc(cartDocRef);

    if (cartDoc.exists()) {
      return cartDoc.data() as CartData;
    }

    return {};
  } catch (error) {
    console.error('Error getting cart:', error);
    return {};
  }
}

/**
 * Check if a service is in user's cart
 */
export async function isInCart(uid: string, serviceId: string): Promise<boolean> {
  try {
    const cart = await getCart(uid);
    return !!cart[serviceId];
  } catch (error) {
    console.error('Error checking cart:', error);
    return false;
  }
}

/**
 * Hook to get real-time cart data
 */
export function useCart(uid: string | null) {
  const [cart, setCart] = useState<CartData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setCart({});
      setIsLoading(false);
      return;
    }

    const cartDocRef = doc(firestore, 'cart', uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(cartDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCart(docSnap.data() as CartData);
      } else {
        setCart({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to cart:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const refreshCart = async () => {
    if (!uid) return;
    const cartData = await getCart(uid);
    setCart(cartData);
  };

  return { cart, isLoading, refreshCart };
}

/**
 * Hook to get real-time cart count (only counts active services)
 */
export function useCartCount(uid: string | null) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const cartDocRef = doc(firestore, 'cart', uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(cartDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const cartData = docSnap.data() as CartData;
        
        // Fetch each service and count only active ones
        const serviceChecks = await Promise.all(
          Object.keys(cartData).map(async (serviceId) => {
            const cartItem = cartData[serviceId];
            const service = await getServiceByIdCityCategory(
              serviceId,
              cartItem.city,
              cartItem.category
            );
            // Return true only if service exists and is active
            return service && service.active;
          })
        );
        
        // Count only the active services
        const activeCount = serviceChecks.filter(Boolean).length;
        setCount(activeCount);
      } else {
        setCount(0);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to cart count:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { count, isLoading };
}

/**
 * Hook to check if a specific service is in cart
 */
export function useIsInCart(uid: string | null, serviceId: string) {
  const [inCart, setInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid || !serviceId) {
      setInCart(false);
      setIsLoading(false);
      return;
    }

    const cartDocRef = doc(firestore, 'cart', uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(cartDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const cartData = docSnap.data() as CartData;
        setInCart(!!cartData[serviceId]);
      } else {
        setInCart(false);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to cart status:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid, serviceId]);

  const refreshStatus = async () => {
    if (!uid || !serviceId) return;
    const result = await isInCart(uid, serviceId);
    setInCart(result);
  };

  return { inCart, isLoading, refreshStatus };
}
