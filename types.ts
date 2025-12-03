export interface PromptEntry {
  id: string;
  text: string;
  sourceUrl: string;
  imageUrl?: string;
  tags: string[];
  category: Category;
  mood?: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bannerURL?: string;
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