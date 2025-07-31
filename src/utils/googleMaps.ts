import { Location, Workspace, WorkspaceDetails, Filters } from '../types';

declare global {
  interface Window {
    initMap: () => void;
  }
}

let map: google.maps.Map | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let directionsService: google.maps.DirectionsService | null = null;
let directionsRenderer: google.maps.DirectionsRenderer | null = null;

// Cache for the Google Maps loading promise
let mapsLoadingPromise: Promise<void> | null = null;

export const initializeMap = (
  mapContainer: HTMLElement,
  center: Location,
  onMapReady?: () => void
): Promise<google.maps.Map> => {
  return new Promise((resolve) => {
    map = new google.maps.Map(mapContainer, {
      center,
      zoom: 15,
      mapId: 'b383c6a11e155d3fcbef2d39',
      gestureHandling: 'greedy',
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      keyboardShortcuts: false,
      clickableIcons: false,
      disableDefaultUI: true
    });

    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#ea580c',
        strokeWeight: 5,
        strokeOpacity: 0.9
      }
    });
    directionsRenderer.setMap(map);

    onMapReady?.();
    resolve(map);
  });
};

export const searchNearbyWorkspaces = (
  location: Location,
  filters: Filters
): Promise<Workspace[]> => {
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('Places service not initialized'));
      return;
    }

    const placeTypes = filters.placeType === 'all' 
      ? ['cafe', 'library'] 
      : [filters.placeType === 'coworking_space' ? 'establishment' : filters.placeType];

    const request: google.maps.places.PlaceSearchRequest = {
      location,
      radius: filters.distance,
      type: placeTypes[0] as any,
      ...(filters.openNow && { openNow: true })
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        let filteredResults = results.filter((place): place is Workspace => {
          if (!place.place_id || !place.geometry?.location) return false;
          
          // Filter by rating
          if (place.rating && place.rating < filters.rating) return false;
          
          // Filter by coworking spaces
          if (filters.placeType === 'coworking_space') {
            const types = place.types || [];
            return types.some(type => 
              type.includes('coworking') || 
              place.name?.toLowerCase().includes('coworking') ||
              place.name?.toLowerCase().includes('workspace') ||
              place.name?.toLowerCase().includes('office')
            );
          }
          
          return true;
        });

        resolve(filteredResults as Workspace[]);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
};

export const getPlaceDetails = (placeId: string): Promise<WorkspaceDetails> => {
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('Places service not initialized'));
      return;
    }

    const request = {
      placeId,
      fields: [
        'place_id', 'name', 'formatted_address', 'geometry', 'rating',
        'formatted_phone_number', 'website', 'opening_hours', 'photos',
        'reviews', 'types', 'price_level', 'user_ratings_total'
      ]
    };

    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        resolve(place as WorkspaceDetails);
      } else {
        reject(new Error(`Place details failed: ${status}`));
      }
    });
  });
};

export const calculateDirections = (
  origin: Location,
  destination: Location
): Promise<google.maps.DirectionsResult> => {
  return new Promise((resolve, reject) => {
    if (!directionsService) {
      reject(new Error('Directions service not initialized'));
      return;
    }

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.WALKING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidTolls: true
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        resolve(result);
      } else {
        reject(new Error(`Directions failed: ${status}`));
      }
    });
  });
};

export const displayDirections = (directionsResult: google.maps.DirectionsResult) => {
  if (directionsRenderer) {
    directionsRenderer.setDirections(directionsResult);
  }
};

export const clearDirections = () => {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] } as any);
  }
};

export const createMarker = (
  position: Location,
  title: string,
  icon?: google.maps.Icon | string,
  onClick?: () => void
): google.maps.Marker => {
  // Default workspace marker icon with orange gradient and glow
  const defaultIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="workspaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
          </linearGradient>
          <filter id="workspaceGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M16 2C11.04 2 7 6.04 7 11c0 7 9 17 9 17s9-10 9-17c0-4.96-4.04-9-9-9zm0 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="url(#workspaceGrad)" filter="url(#workspaceGlow)"/>
        <circle cx="16" cy="11" r="2.5" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 32)
  };

  const marker = new google.maps.Marker({
    position,
    map,
    title,
    icon: icon || defaultIcon
  });

  if (onClick) {
    marker.addListener('click', onClick);
  }

  return marker;
};

export const loadGoogleMapsScript = (): Promise<void> => {
  // Return cached promise if already loading or loaded
  if (mapsLoadingPromise) {
    return mapsLoadingPromise;
  }

  // If already loaded, return resolved promise
  if (window.google && window.google.maps) {
    mapsLoadingPromise = Promise.resolve();
    return mapsLoadingPromise;
  }

  // Create new loading promise
  mapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    // Create callback function name
    const callbackName = 'initGoogleMaps';
    
    // Set up global callback
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return mapsLoadingPromise;
};