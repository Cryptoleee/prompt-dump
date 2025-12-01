import { PromptEntry, Category } from './types';

export const INITIAL_PROMPTS: PromptEntry[] = [
  {
    id: '1',
    text: 'Full body [Subject] toy, [attributes/accessories], [expression], made of felt, in a [place], [lighting], friendly and cartoonish appearance, rich and soft textures',
    sourceUrl: 'https://x.com/MayorKingAI/status/1995109461875114311',
    imageUrl: 'https://images.unsplash.com/photo-1558679908-16e788419646?q=80&w=2600&auto=format&fit=crop',
    tags: ['felt', 'toy', 'character', 'cute', 'texture'],
    category: Category.THREE_D,
    mood: 'Playful',
    createdAt: Date.now(),
  }
];

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.PHOTOREALISTIC]: 'bg-blue-900/30 text-blue-300 border-blue-800',
  [Category.ILLUSTRATION]: 'bg-pink-900/30 text-pink-300 border-pink-800',
  [Category.THREE_D]: 'bg-purple-900/30 text-purple-300 border-purple-800',
  [Category.VECTOR]: 'bg-green-900/30 text-green-300 border-green-800',
  [Category.PAINTING]: 'bg-orange-900/30 text-orange-300 border-orange-800',
  [Category.OTHER]: 'bg-gray-800 text-gray-300 border-gray-700',
  [Category.UNSORTED]: 'bg-slate-800 text-slate-300 border-slate-700',
};