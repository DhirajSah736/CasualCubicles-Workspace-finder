export interface Location {
  lat: number;
  lng: number;
}

export interface Workspace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: Location;
  };
  rating?: number;
  price_level?: number;
  opening_hours?: google.maps.places.OpeningHours;
  photos?: google.maps.places.PlacePhoto[];
  types: string[];
  business_status?: string;
  user_ratings_total?: number;
}

export interface WorkspaceDetails extends Workspace {
  formatted_phone_number?: string;
  website?: string;
  reviews?: google.maps.places.PlaceReview[];
  opening_hours?: google.maps.places.OpeningHours;
}

export interface Filters {
  distance: number;
  rating: number;
  placeType: 'cafe' | 'library' | 'coworking_space' | 'all';
  openNow: boolean;
}

export interface DirectionsResult {
  routes: google.maps.DirectionsRoute[];
  geocoded_waypoints: google.maps.DirectionsGeocodedWaypoint[];
}