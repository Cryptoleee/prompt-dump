
import React, { useState } from 'react';
import { Search, Heart, Filter, ChevronDown, ChevronUp, X, Layers } from 'lucide-react';
import { Category } from '../types';
import { getCategoryColor } from '../constants';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSpecialCategory = selectedCategory === 'All' || selectedCategory === 'Favorites';
  const activeLabel = isSpecialCategory ? 'Categories' : selectedCategory;

  return (
    <div className="mb-8 space-y-4">
      {/* Main Bar: Search + Quick Actions + Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow group z-10">
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

        {/* Quick Filters Row */}
        <div className="flex gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
            <button
                onClick={() => { onCategoryChange('All'); setIsExpanded(false); }}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                selectedCategory === 'All'
                    ? 'bg-white text-dark-bg border-white shadow-lg shadow-white/10'
                    : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
                }`}
            >
                <Layers className="w-4 h-4" />
                All
            </button>

            <button
                onClick={() => { onCategoryChange('Favorites'); setIsExpanded(false); }}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                selectedCategory === 'Favorites'
                    ? 'bg-neon-pink text-white border-neon-pink shadow-lg shadow-neon-pink/20'
                    : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
                }`}
            >
                <Heart className={`w-4 h-4 ${selectedCategory === 'Favorites' ? 'fill-white' : ''}`} />
                Favorites
            </button>

            {/* Category Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 min-w-[140px] justify-between ${
                !isSpecialCategory
                    ? 'bg-brand-accent text-white border-brand-accent shadow-lg shadow-brand-accent/20'
                    : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-600 hover:text-white'
                }`}
            >
                <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {activeLabel}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Expandable Category Grid (Drawer) */}
      {isExpanded && (
        <div className="bg-dark-card border border-dark-border rounded-3xl p-4 md:p-6 animate-in slide-in-from-top-2 fade-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Select Category</h3>
                <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
                {Object.values(Category).map((cat) => {
                    const isActive = selectedCategory === cat;
                    const colorClass = getCategoryColor(cat);
                    
                    return (
                        <button
                            key={cat}
                            onClick={() => { onCategoryChange(cat); setIsExpanded(false); }}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border flex-grow md:flex-grow-0 text-center ${
                                isActive
                                ? `bg-brand-accent text-white border-brand-accent shadow-md`
                                : `bg-dark-bg text-gray-400 border-dark-border hover:border-gray-600 hover:text-white`
                            }`}
                        >
                            {cat}
                        </button>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};
