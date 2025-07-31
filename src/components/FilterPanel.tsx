import React from 'react';
import { Filters } from '../types';
import { MapPin, Star, Clock, Filter, X } from 'lucide-react';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose
}) => {
  const handleFilterChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <>
      {/* Filter Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-sm
        bg-black/40 backdrop-blur-xl border-l border-orange-500/20 shadow-2xl shadow-orange-500/10
        transform transition-transform duration-300 ease-in-out z-10
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 pt-20 md:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-serif font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent flex items-center gap-2 tracking-wide">
              <Filter className="w-5 h-5 text-orange-500" />
              Filters
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-orange-400 p-1 transition-colors duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Distance Filter */}
          <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 text-sm font-sans font-semibold text-white tracking-wide">
              <MapPin className="w-4 h-4 text-orange-400" />
              Distance
            </label>
            <select
              value={filters.distance}
              onChange={(e) => handleFilterChange('distance', Number(e.target.value))}
              className="w-full bg-black backdrop-blur-sm border border-orange-500/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 font-sans font-medium tracking-wide"
            >
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
              <option value={5000}>5km</option>
            </select>
          </div>

          {/* Rating Filter */}
            <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 text-sm font-sans font-semibold text-white tracking-wide">
              <Star className="w-4 h-4 text-orange-400" />
              Minimum Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
              className="w-full bg-black backdrop-blur-lg border border-orange-500/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 font-sans font-medium tracking-wide"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div> 

            


          {/* Place Type Filter */}
          <div className="space-y-2 md:space-y-3">
            <label className="text-sm font-sans font-semibold text-white tracking-wide">
              Place Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'cafe', label: 'Cafes' },
                { value: 'library', label: 'Libraries' },
                { value: 'coworking_space', label: 'Coworking' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleFilterChange('placeType', type.value as any)}
                  className={`
                    p-2 rounded-lg text-xs md:text-sm font-sans font-semibold transition-all duration-200 tracking-wide
                    ${filters.placeType === type.value
                      ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600'
                      : 'bg-black/60 backdrop-blur-sm text-gray-300 hover:bg-[#F97316] hover:text-white border border-orange-500/20'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Open Now Filter */}
          <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 text-sm font-sans font-semibold text-white tracking-wide">
              <Clock className="w-4 h-4 text-orange-400" />
              Open Now
            </label>
            <button
              onClick={() => handleFilterChange('openNow', !filters.openNow)}
              className={`
                w-full p-2 md:p-3 rounded-lg text-sm font-sans font-semibold transition-all duration-200 tracking-wide
                ${filters.openNow
                  ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600'
                  : 'bg-black/60 backdrop-blur-sm text-gray-300 hover:bg-[#F97316] hover:text-white border border-orange-500/20'
                }
              `}
            >
              {filters.openNow ? 'Open Now Only' : 'Any Time'}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default FilterPanel;