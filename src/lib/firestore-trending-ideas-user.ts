import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { firestore } from './firebase-config';
import { TrendingIdea } from './firestore-trending-ideas';

const COLLECTION_NAME = 'trending_ideas';

export const THEMES = [
  'Royal Rajasthani',
  'South Indian Temple',
  'Punjabi Big Fat Wedding',
  'Minimal Pastel',
  'Modern Luxe',
  'Beach Wedding',
  'Floral Fantasy',
  'Vintage Heritage',
  'Bengali Traditional',
  'Small Intimate Wedding'
];

export async function getActiveTrendingIdeas(): Promise<TrendingIdea[]> {
  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('status', '==', 'active'),
      orderBy('priority', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrendingIdea));
  } catch (error) {
    console.error('Error fetching active trending ideas:', error);
    return [];
  }
}

export async function getIdeasByTheme(theme: string): Promise<TrendingIdea[]> {
  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('status', '==', 'active'),
      where('theme', '==', theme),
      orderBy('priority', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrendingIdea));
  } catch (error) {
    console.error(`Error fetching ideas for theme ${theme}:`, error);
    return [];
  }
}

export function groupIdeasByTheme(ideas: TrendingIdea[]): Record<string, TrendingIdea[]> {
  const grouped: Record<string, TrendingIdea[]> = {};
  
  THEMES.forEach(theme => {
    grouped[theme] = [];
  });
  
  ideas.forEach(idea => {
    if (idea.theme && grouped[idea.theme]) {
      grouped[idea.theme].push(idea);
    }
  });
  
  return grouped;
}
