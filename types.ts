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