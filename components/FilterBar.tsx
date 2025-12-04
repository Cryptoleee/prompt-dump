
import React from 'react';
import { Search, Heart } from 'lucide-react';
import { Category } from '../types';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: Category | 'All' | 'Favorites';
  onCategoryChange: (cat: Category | 'All' | 'Favorites') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
      <div className="relative w-full md:w-96 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-dark-border rounded-2xl bg-dark-card text-white shadow-sm focus:ring-2 focus:ring-brand-accent focus:border-transparent focus:outline-none transition-all placeholder-gray-600"
          placeholder="Search keywords, tags..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto p-2 pr-4 w-full md:w-auto no-scrollbar">
        <button
          onClick={() => onCategoryChange('All')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
            selectedCategory === 'All'
              ? 'bg-white text-dark-bg border-white shadow-lg shadow-white/10'
              : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
          }`}
        >
          All
        </button>

        <button
          onClick={() => onCategoryChange('Favorites')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
            selectedCategory === 'Favorites'
              ? 'bg-neon-pink/20 text-neon-pink border-neon-pink shadow-[0_0_15px_rgba(236,72,153,0.2)]'
              : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${selectedCategory === 'Favorites' ? 'fill-neon-pink' : ''}`} />
          Favorites
        </button>

        {Object.values(Category).map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-brand-accent/20 text-brand-accent border-brand-accent shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
