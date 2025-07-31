import React, { useRef, useEffect } from 'react';
import { MapPin, Filter, Search, List,LocateFixed } from 'lucide-react';
import { Location } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersToggle: () => void;
  onLocationSelect: (location: Location, address: string) => void;
  onWorkspaceListToggle: () => void;
  workspaceCount: number;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onFiltersToggle,
  onLocationSelect,
  onWorkspaceListToggle,
  workspaceCount
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!searchInputRef.current || !window.google?.maps?.places) {
        return;
      }

      // Clear existing autocomplete if it exists
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Create new autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment'],
        fields: ['place_id', 'geometry', 'formatted_address', 'name']
      });

      // Add place changed listener
      const placeChangedListener = () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place && place.geometry && place.geometry.location) {
          const location: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          const address = place.formatted_address || place.name || '';
          onLocationSelect(location, address);
          onSearchChange(address);
        }
      };

      autocompleteRef.current.addListener('place_changed', placeChangedListener);
    };

    // Initialize autocomplete when Google Maps is loaded
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogleMaps);
          initializeAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // If user clears the search, reset the location
    if (value === '') {
      onLocationSelect({ lat: 0, lng: 0 }, '');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If autocomplete didn't trigger and we have a search query, try geocoding
      if (searchQuery && searchQuery.trim()) {
        if (window.google?.maps) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: searchQuery }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              };
              const address = results[0].formatted_address;
              onLocationSelect(location, address);
              onSearchChange(address);
            }
          });
        }
      }
    }
  };
// bg-black/40
  return (
    <header className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 px-3 md:px-4 py-3 flex items-center gap-2 md:gap-4 z-30 relative h-16">
      {/* Mobile Workspace List Toggle */}
      <button
        onClick={onWorkspaceListToggle}
        className="md:hidden flex items-center gap-1 px-2 py-2 bg-[#F97316] rounded-lg transition-all duration-300 flex-shrink-0 hover:scale-105 transform shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:bg-orange-600 font-sans font-semibold"
      >
        <List className="w-5 h-5" />
        <span className="text-xs font-semibold text-white tracking-wide">{workspaceCount}</span>
      </button>

      {/* App Title */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
        <LocateFixed className="w-10 h-10 text-orange-500" />
        <h1 className="text-lg md:text-xl lilita-one-regular bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent truncate tracking-wide">
          <span className="hidden sm:inline text-[30px] md:text-[37px]">Casual<span className='text-white/95'>Cubicles</span> </span>
          <span className="sm:hidden">WorkSpace</span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative min-w-0 ml-4 md:ml-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Search location..."
            className="w-full pl-10 pr-4 py-2 bg-black backdrop-blur-xl border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-400 transition-all duration-300 focus:bg-black font-sans font-medium tracking-wide"
          />
        </div>
      </div>

      {/* Filters Button */}
      <button
        onClick={onFiltersToggle}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#F97316] border border-orange-500/20 rounded-lg hover:bg-orange-600 transition-all duration-300 flex-shrink-0 hover:scale-105 transform shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 font-sans font-semibold tracking-wide"
      >
        <Filter className="w-4 h-4 text-white" />
        <span className="hidden md:inline text-white font-medium">Filters</span>
        <span className="md:hidden text-white font-semibold text-sm">Filter</span>
      </button>
    </header>
  );
};

export default Header;