import React, { useEffect, useRef, useState } from 'react';
import { Location, Workspace, Filters } from '../types';
import { 
  initializeMap, 
  searchNearbyWorkspaces, 
  createMarker,
  calculateDirections,
  displayDirections,
  clearDirections
} from '../utils/googleMaps';

interface MapContainerProps {
  userLocation: Location | null;
  filters: Filters;
  searchQuery: string;
  searchAddress: string;
  onWorkspaceSelect: (placeId: string) => void;
  onWorkspacesUpdate: (workspaces: Workspace[], loading: boolean) => void;
  navigationDestination: Location | null;
  onNavigationComplete: () => void;
  onLocationChange: (location: Location | null) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  userLocation,
  filters,
  searchQuery,
  searchAddress,
  onWorkspaceSelect,
  onWorkspacesUpdate,
  navigationDestination,
  onNavigationComplete,
  onLocationChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');

  // Initialize map
  useEffect(() => {
    if (mapRef.current && userLocation) {
      initializeMap(mapRef.current, userLocation)
        .then((googleMap) => {
          setMap(googleMap);
        })
        .catch((error) => {
          console.error('Failed to initialize map:', error);
        });
    }
  }, [userLocation]);

  // Handle search location changes and update markers
  useEffect(() => {
    if (!map) return;

    if (searchAddress && userLocation) {
      // Only update if we have a valid location
      const targetLocation = userLocation;
      
      // Remove existing search marker
      if (searchMarker) {
        searchMarker.setMap(null);
        setSearchMarker(null);
      }
      
      // Add new search marker
      const marker = createMarker(
        targetLocation,
        'Search Location',
        {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C11.04 2 7 6.04 7 11c0 7 9 17 9 17s9-10 9-17c0-4.96-4.04-9-9-9zm0 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="#ff4444"/>
              <circle cx="16" cy="11" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      );
      setSearchMarker(marker);
      
      // Center map on search location with smooth animation
      map.panTo(targetLocation);
      
    } else if (!searchAddress && searchMarker) {
      // Clear search marker when search is cleared
      searchMarker.setMap(null);
      setSearchMarker(null);
    }
  }, [map, searchAddress, userLocation]);

  // Update user marker
  useEffect(() => {
    if (map && userLocation) {
      if (userMarker) {
        userMarker.setPosition(userLocation);
      } else {
        const marker = createMarker(
          userLocation,
          'Your Location',
          {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
                  </linearGradient>
                  <filter id="userGlow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="12" cy="12" r="8" fill="url(#userGrad)" filter="url(#userGlow)"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        );
        setUserMarker(marker);
      }
    }
  }, [map, userLocation]);

  // Search for workspaces when filters change
  useEffect(() => {
    const activeLocation = userLocation;
    if (!activeLocation || !map) return;

    // Create a unique key for current search parameters
    const searchParams = JSON.stringify({ 
      location: activeLocation, 
      filters, 
      searchQuery 
    });

    // Skip if same search parameters
    if (searchParams === lastSearchParams) return;

    setLastSearchParams(searchParams);
    setIsSearching(true);
    onWorkspacesUpdate([], true);
      
    searchNearbyWorkspaces(activeLocation, filters)
      .then((results) => {
        onWorkspacesUpdate(results, false);
      })
      .catch((error) => {
        console.error('Failed to search workspaces:', error);
        onWorkspacesUpdate([], false);
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [userLocation, filters, searchQuery, map, onWorkspacesUpdate, lastSearchParams]);

  // Update workspace markers - separate effect to prevent flickering
  useEffect(() => {
    // This effect will be triggered by parent component when workspaces change
    // We'll handle marker updates through a callback prop instead
  }, []);

  // Function to update markers (called from parent)
  const updateMarkers = (workspaces: Workspace[]) => {
    if (!map) return;

    // Clear existing markers only when we have new data
    if (markers.length > 0) {
      markers.forEach(marker => marker.setMap(null));
    }

    if (workspaces.length > 0) {
      const newMarkers = workspaces.map((workspace) => {
        const marker = createMarker(
          workspace.geometry.location,
          workspace.name,
          undefined, // Use default marker icon
          () => onWorkspaceSelect(workspace.place_id)
        );
        return marker;
      });
      
      setMarkers(newMarkers);
    } else {
      setMarkers([]);
    }
  };

  // Expose updateMarkers function to parent
  useEffect(() => {
    if (map) {
      (window as any).updateMapMarkers = updateMarkers;
    }
    return () => {
      delete (window as any).updateMapMarkers;
    };
  }, [map, markers, onWorkspaceSelect]);

  // Handle navigation
  useEffect(() => {
    if (userLocation && navigationDestination) {
      calculateDirections(userLocation, navigationDestination)
        .then((result) => {
          displayDirections(result);
          onNavigationComplete();
        })
        .catch((error) => {
          console.error('Failed to calculate directions:', error);
          onNavigationComplete();
        });
    } else {
      clearDirections();
    }
  }, [userLocation, navigationDestination, onNavigationComplete]);

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-xl rounded-lg shadow-lg shadow-orange-500/20 px-4 py-2 z-10 border border-orange-500/20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            <span className="text-sm text-white font-sans font-medium tracking-wide">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;