import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { firestore } from './firebase-config';

export interface TrendingIdea {
  id?: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  videoType: 'youtube' | 'mp4';
  videoUrl: string;
  thumbnailUrl: string;
  theme: string;
  cultureTags: string[];
  relatedServices: string[];
  estimatedBudgetRange: {
    min: number;
    max: number;
  };
  cityPreference: string[];
  isTrending: boolean;
  priority: number;
  status: 'active' | 'inactive';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
}

const COLLECTION_NAME = 'trending_ideas';

export async function getAllTrendingIdeas(): Promise<TrendingIdea[]> {
  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      orderBy('priority', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrendingIdea));
  } catch (error) {
    console.error('Error fetching trending ideas:', error);
    throw error;
  }
}

export async function getTrendingIdeaById(id: string): Promise<TrendingIdea | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TrendingIdea;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trending idea:', error);
    throw error;
  }
}

export async function createTrendingIdea(data: Omit<TrendingIdea, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating trending idea:', error);
    throw error;
  }
}

export async function updateTrendingIdea(
  id: string,
  data: Partial<Omit<TrendingIdea, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
): Promise<void> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating trending idea:', error);
    throw error;
  }
}

export async function deleteTrendingIdea(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting trending idea:', error);
    throw error;
  }
}

export async function toggleTrendingIdeaStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<void> {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateTrendingIdea(id, { status: newStatus });
  } catch (error) {
    console.error('Error toggling trending idea status:', error);
    throw error;
  }
}
