export interface PromptEntry {
  id: string;
  text: string;
  sourceUrl: string;
  imageUrl?: string;
  tags: string[];
  category: Category;
  mood?: string;
  createdAt: number;
  userId: string;
}

export interface UserProfile {
  uid: string;
  displayName: string; // This is now used as the "Real Name" or "Display Name"
  username?: string;   // The unique @handle
  photoURL?: string;
  bannerURL?: string;
  bannerSourceURL?: string; // The original uncropped image
  bio?: string;
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
  category: Category;
  mood: string;
}

export const GUEST_USER_ID = 'guest';