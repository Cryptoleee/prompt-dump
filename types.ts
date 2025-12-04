
export interface PromptEntry {
  id: string;
  text: string;
  sourceUrl: string;
  imageUrl?: string;
  tags: string[];
  category: string; // Changed from enum to string to support custom categories
  mood?: string;
  createdAt: number;
  userId: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bannerURL?: string;
  bannerSourceURL?: string;
  bio?: string;
  following?: string[]; // Array of UIDs this user follows
  likedPrompts?: string[]; // Array of prompt IDs this user likes
}

export enum Category {
  PHOTOREALISTIC = 'Photorealistic',
  ILLUSTRATION = 'Illustration',
  THREE_D = '3D Render',
  VECTOR = 'Vector',
  PAINTING = 'Painting',
  OTHER = 'Other',
  UNSORTED = 'Unsorted'
}

export interface AnalysisResult {
  tags: string[];
  category: string;
  mood: string;
}

export const GUEST_USER_ID = 'guest';
