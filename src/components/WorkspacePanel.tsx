import React, { useState, useEffect } from 'react';
import { WorkspaceDetails, Location } from '../types';
import { getPlaceDetails } from '../utils/googleMaps';
import { isFavorite, saveFavorite, removeFavorite } from '../utils/storage';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  Navigation, 
  Heart, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WorkspacePanelProps {
  placeId: string | null;
  userLocation: Location | null;
  onClose: () => void;
  onNavigate: (destination: Location) => void;
  isOpen: boolean;
}

const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  placeId,
  userLocation,
  onClose,
  onNavigate,
  isOpen
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (placeId) {
      setLoading(true);
      setError(null);
      setIsFav(isFavorite(placeId));

      getPlaceDetails(placeId)
        .then((details) => {
          setWorkspace(details);
          setCurrentPhotoIndex(0);
        })
        .catch((error) => {
          console.error('Failed to load workspace details:', error);
          setError('Failed to load workspace details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setWorkspace(null);
    }
  }, [placeId]);

  const handleFavoriteToggle = () => {
    if (!placeId) return;

    if (isFav) {
      removeFavorite(placeId);
      setIsFav(false);
    } else {
      saveFavorite(placeId);
      setIsFav(true);
    }
  };

  const handleNavigate = () => {
    if (workspace?.geometry?.location) {
      onNavigate(workspace.geometry.location);
    }
  };

  const getPhotoUrl = (photo: google.maps.places.PlacePhoto, maxWidth: number = 400) => {
    return photo.getUrl({ maxWidth });
  };

  const nextPhoto = () => {
    if (workspace?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === workspace.photos!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (workspace?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? workspace.photos!.length - 1 : prev - 1
      );
    }
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  // const getOpeningStatus = (workspace: WorkspaceDetails): { text: string; isOpen: boolean | null } => {
  //   // Check business status first (replaces deprecated permanently_closed)
  //   if (workspace.business_status === 'CLOSED_PERMANENTLY') {
  //     return { text: 'Permanently closed', isOpen: false };
  //   }
  //   if (workspace.business_status === 'CLOSED_TEMPORARILY') {
  //     return { text: 'Temporarily closed', isOpen: false };
  //   }
    
  //   // Try to use the isOpen() method first
  //   if (workspace.opening_hours) {
  //     try {
  //       if (typeof workspace.opening_hours.isOpen === 'function') {
  //         const isCurrentlyOpen = workspace.opening_hours.isOpen();
  //         return {
  //           text: isCurrentlyOpen ? 'Open' : 'Closed',
  //           isOpen: isCurrentlyOpen
  //         };
  //       }
  //     } catch (error) {
  //       console.warn('Error using isOpen() method:', error);
  //     }
      
  //     // Fallback: try to determine from periods
  //     if (workspace.opening_hours.periods) {
  //       try {
  //         const now = new Date();
  //         const currentDay = now.getDay();
  //         const currentTime = now.getHours() * 100 + now.getMinutes();
          
  //         const todayPeriods = workspace.opening_hours.periods.filter((period: any) => 
  //           period.open && period.open.day === currentDay
  //         );
          
  //         for (const period of todayPeriods) {
  //           const openTime = period.open.time ? parseInt(period.open.time) : 0;
  //           const closeTime = period.close ? parseInt(period.close.time) : 2359;
            
  //           if (currentTime >= openTime && currentTime <= closeTime) {
  //             return { text: 'Open', isOpen: true };
  //           }
  //         }
  //         return { text: 'Closed', isOpen: false };
  //       } catch (error) {
  //         console.warn('Error parsing opening hours periods:', error);
  //       }
  //     }
  //   }
    
  //   return { text: 'Hours unavailable', isOpen: null };
  // };

  const getOpeningStatus = (workspace) => {
  if (workspace.business_status === 'CLOSED_PERMANENTLY') {
    return { text: 'Permanently closed', isOpen: false };
  }
  if (workspace.business_status === 'CLOSED_TEMPORARILY') {
    return { text: 'Temporarily closed', isOpen: false };
  }

  const openingHours = workspace.opening_hours;
  if (openingHours && Array.isArray(openingHours.periods)) {
    try {
      const now = new Date();
      const today = now.getDay(); // 0 (Sunday) to 6 (Saturday)
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const todayPeriods = openingHours.periods.filter(
        period => period.open && period.open.day === today
      );
      for (const period of todayPeriods) {
        const openTime = period.open.time ? parseInt(period.open.time) : 0;
        let closeTime = period.close ? parseInt(period.close.time) : 2359;
        if (!period.close || typeof period.close.time !== 'string') {
          closeTime = 2359; // open 24h
        }
        if (currentTime >= openTime && currentTime <= closeTime) {
          return { text: 'Open', isOpen: true };
        }
      }
      return { text: 'Closed', isOpen: false };
    } catch (error) {
      console.warn('Error parsing opening hours periods:', error);
    }
  }

  return { text: 'Hours unavailable', isOpen: null };
};


  if (!isOpen || !placeId) return null;

  return (
    <div className={`
      fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md
      bg-black/70 backdrop-blur-xl border-l border-orange-500/30 shadow-2xl shadow-orange-500/20
      transform transition-transform duration-300 ease-in-out z-20 pb-[2rem]
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      overflow-y-auto
    `}
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#f97316 #1a1a1a'
    }}
    >
      <div className="p-4 md:p-6 pt-20 md:pt-20 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-serif font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-wide">Workspace Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-full transition-all duration-300 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-300 font-sans font-medium tracking-wide">Loading details...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400 font-sans font-medium tracking-wide">{error}</p>
          </div>
        )}

        {workspace && (
          <div className="space-y-4 md:space-y-6">
            {/* Photos */}
            {workspace.photos && workspace.photos.length > 0 && (
              <div className="relative">
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img
                    src={getPhotoUrl(workspace.photos[currentPhotoIndex])}
                    alt={workspace.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  
                  {workspace.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Photo counter */}
                  {workspace.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                      {currentPhotoIndex + 1} / {workspace.photos.length}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base md:text-lg font-serif font-semibold text-white pr-2 tracking-wide">{workspace.name}</h3>
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-2 rounded-full transition-colors ${
                    isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="text-xs md:text-sm font-sans tracking-wide">{workspace.formatted_address}</span>
              </div>

              {/* Rating */}
              {workspace.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-white font-sans font-semibold tracking-wide">
                      <span className="text-sm md:text-base">{formatRating(workspace.rating)}</span>
                    </span>
                  </div>
                  {workspace.user_ratings_total && (
                    <span className="text-gray-400 text-sm font-sans tracking-wide">
                      ({workspace.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Opening Hours */}
              {(workspace.opening_hours || workspace.business_status) && (
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className={`text-sm font-sans font-medium tracking-wide ${
                    getOpeningStatus(workspace).isOpen === true
                      ? 'text-green-400'
                      : getOpeningStatus(workspace).isOpen === false
                      ? 'text-red-400'
                      : 'text-gray-500'
                  }`}>
                    {getOpeningStatus(workspace).text}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 md:space-y-3">
              {workspace.formatted_phone_number && (
                <a
                  href={`tel:${workspace.formatted_phone_number}`}
                  className="flex items-center gap-3 p-3 bg-black/80 backdrop-blur-sm rounded-lg hover:bg-orange-500/30 transition-all duration-300 border border-orange-500/30 hover:border-orange-500/50"
                >
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span className="text-sm md:text-base text-white font-sans font-medium tracking-wide">{workspace.formatted_phone_number}</span>
                </a>
              )}

              {workspace.website && (
                <a
                  href={workspace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-black/80 backdrop-blur-sm rounded-lg hover:bg-orange-500/30 transition-all duration-300 border border-orange-500/30 hover:border-orange-500/50"
                >
                  <Globe className="w-5 h-5 text-orange-400" />
                  <span className="text-sm md:text-base text-white font-sans font-medium tracking-wide">Visit Website</span>
                </a>
              )}
            </div>

            {/* Opening Hours Details */}
            {workspace.opening_hours?.weekday_text && (
              <div>
                <h4 className="text-sm md:text-base text-white font-serif font-semibold mb-2 md:mb-3 tracking-wide">Opening Hours</h4>
                <div className="space-y-1">
                  {workspace.opening_hours.weekday_text.map((day, index) => (
                    <div key={index} className="text-sm text-gray-300 font-sans tracking-wide">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {workspace.reviews && workspace.reviews.length > 0 && (
              <div>
                <h4 className="text-sm md:text-base text-white font-serif font-semibold mb-2 md:mb-3 tracking-wide">Recent Reviews</h4>
                <div className="space-y-3 md:space-y-4">
                  {workspace.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="bg-black/80 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm font-sans tracking-wide">
                          {review.author_name}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-sans tracking-wide">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Button */}
            {userLocation && workspace.geometry?.location && (
              <button
                onClick={handleNavigate}
                className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-sans font-semibold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transform tracking-wide"
              >
                <Navigation className="w-5 h-5" />
                <span className="text-sm md:text-base">Start Navigation</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePanel;