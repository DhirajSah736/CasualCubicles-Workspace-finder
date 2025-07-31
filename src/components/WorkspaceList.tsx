import React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Workspace } from '../types';
import { getPlaceDetails } from '../utils/googleMaps';
import { Star, MapPin, Clock, DollarSign, X } from 'lucide-react';

interface WorkspaceListProps {
  workspaces: Workspace[];
  onWorkspaceSelect: (placeId: string) => void;
  selectedWorkspaceId: string | null;
  loading: boolean;
  onClose?: () => void;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  onWorkspaceSelect,
  selectedWorkspaceId,
  loading,
  onClose
}) => {
  const [workspaceDetails, setWorkspaceDetails] = useState<{[key: string]: any}>({});
  const [loadingDetails, setLoadingDetails] = useState<{[key: string]: boolean}>({});
  const [openingStatus, setOpeningStatus] = useState<{[key: string]: { text: string; isOpen: boolean | null }}>({});

  // Fetch details for workspaces to get photos and reviews
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (workspaces.length === 0) return;
      
      setLoadingDetails({});
      const details: {[key: string]: any} = {};
      const loadingStates: {[key: string]: boolean} = {};
      
      // Initialize loading states
      workspaces.forEach(workspace => {
        loadingStates[workspace.place_id] = true;
      });
      setLoadingDetails(loadingStates);
      
      // Process all workspaces, not just first 10
      const promises = workspaces.map(async (workspace) => {
        try {
          const placeDetails = await getPlaceDetails(workspace.place_id);
          details[workspace.place_id] = {
            photos: placeDetails.photos,
            reviews: placeDetails.reviews,
            loaded: true,
            opening_hours: placeDetails.opening_hours,
            business_status: placeDetails.business_status
          };
          
          // Get opening status using proper isOpen() method
          const openStatus = getOpeningStatus(placeDetails);
          setOpeningStatus(prev => ({
            ...prev,
            [workspace.place_id]: openStatus
          }));
        } catch (error) {
          console.warn(`Failed to fetch details for ${workspace.name}:`, error);
          details[workspace.place_id] = {
            photos: workspace.photos || [], // Fallback to workspace photos if available
            reviews: [],
            loaded: false,
            opening_hours: null,
            business_status: null
          };
          
          setOpeningStatus(prev => ({
            ...prev,
            [workspace.place_id]: { text: 'Hours unavailable', isOpen: null }
          }));
        }
        
        // Update loading state for this workspace
        setLoadingDetails(prev => ({
          ...prev,
          [workspace.place_id]: false
        }));
      });
      
      // Wait for all requests to complete
      await Promise.allSettled(promises);
      
      setWorkspaceDetails(details);
    };

    fetchWorkspaceDetails();
  }, [workspaces]);

  // const getOpeningStatus = (placeDetails: any): { text: string; isOpen: boolean | null } => {
  //   // Check business status first
  //   if (businessStatus === 'CLOSED_PERMANENTLY') {
  //     return { text: 'Permanently closed', isOpen: false };
  //   }
  //   if (businessStatus === 'CLOSED_TEMPORARILY') {
  //     return { text: 'Temporarily closed', isOpen: false };
  //   }
    
  //   // Try to use the isOpen() method first
  //   if (placeDetails.opening_hours) {
  //     try {
  //       if (typeof placeDetails.opening_hours.isOpen === 'function') {
  //         const isCurrentlyOpen = placeDetails.opening_hours.isOpen();
  //         return {
  //           text: isCurrentlyOpen ? 'Open' : 'Closed',
  //           isOpen: isCurrentlyOpen
  //         };
  //       }
  //     } catch (error) {
  //       console.warn('Error using isOpen() method:', error);
  //     }
      
  //     // Fallback: try to determine from periods
  //     if (placeDetails.opening_hours.periods) {
  //       try {
  //         const now = new Date();
  //         const currentDay = now.getDay();
  //         const currentTime = now.getHours() * 100 + now.getMinutes();
          
  //         const todayPeriods = placeDetails.opening_hours.periods.filter((period: any) => 
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
    
  //   // Check if opening_hours exists and has data
  //   if (openingHours) {
  //     try {
  //       // Try to use the isOpen() method first
  //       if (typeof openingHours.isOpen === 'function') {
  //         const isOpen = openingHours.isOpen();
  //         if (isOpen === true) {
  //           return { text: 'Open', isOpen: true };
  //         } else if (isOpen === false) {
  //           return { text: 'Closed', isOpen: false };
  //         }
  //       }
  //     } catch (error) {
  //       console.warn('Error checking opening hours:', error);
  //     }
  //   }
    
  //   // If no opening hours data is available, don't show status
  //   return { text: 'Hours unavailable', isOpen: null };
  // };

  // Memoize expensive calculations to prevent flickering
  
  const getOpeningStatus = (placeDetails) => {
  // Extract business status and opening_hours safely from placeDetails
  const businessStatus = placeDetails.business_status || '';
  const openingHours = placeDetails.opening_hours || null;

  // Business closed statuses
  if (businessStatus === 'CLOSED_PERMANENTLY') {
    return { text: 'Permanently closed', isOpen: false };
  }
  if (businessStatus === 'CLOSED_TEMPORARILY') {
    return { text: 'Temporarily closed', isOpen: false };
  }

  // Handle opening_hours->periods logic
  if (openingHours && Array.isArray(openingHours.periods)) {
    try {
      const now = new Date();
      const today = now.getDay(); // 0 (Sunday) to 6 (Saturday)
      const currentTime = now.getHours() * 100 + now.getMinutes();
      // Go through all periods for today
      const todayPeriods = openingHours.periods.filter(period => period.open && period.open.day === today);

      for (const period of todayPeriods) {
        const openTime = period.open.time ? parseInt(period.open.time) : 0;
        let closeTime = period.close ? parseInt(period.close.time) : 2359;
        // If no close time, consider it open 24h
        if (!period.close || typeof period.close.time !== 'string') {
          closeTime = 2359;
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

  // Show 'Hours unavailable' if all else fails
  return { text: 'Hours unavailable', isOpen: null };
};

  
  const workspaceData = useMemo(() => {
    const mappedWorkspaces = workspaces.map(workspace => {
      const placeTypeLabel = (() => {
        if (workspace.types.includes('cafe')) return 'Cafe';
        if (workspace.types.includes('library')) return 'Library';
        if (workspace.types.some(type => type.includes('coworking') || type.includes('office'))) return 'Workspace';
        return 'Cafe';
      })();

      const placeTypeColor = (() => {
        if (workspace.types.includes('cafe')) return 'bg-orange-100 text-orange-800';
        if (workspace.types.includes('library')) return 'bg-blue-100 text-blue-800';
        if (workspace.types.some(type => type.includes('coworking') || type.includes('office'))) return 'bg-purple-100 text-purple-800';
        return 'bg-orange-100 text-orange-800';
      })();

      return {
        place_id: workspace.place_id,
        name: workspace.name,
        formatted_address: workspace.formatted_address,
        geometry: workspace.geometry,
        rating: workspace.rating,
        user_ratings_total: workspace.user_ratings_total,
        price_level: workspace.price_level,
        types: workspace.types,
        opening_hours: workspace.opening_hours,
        business_status: workspace.business_status,
        photos: workspace.photos,
        placeTypeLabel,
        placeTypeColor
      };
    });

    // Sort by rating (highest first), then by number of reviews
    return mappedWorkspaces.sort((a, b) => {
      // If both have ratings, sort by rating first
      if (a.rating && b.rating) {
        if (a.rating !== b.rating) {
          return b.rating - a.rating; // Higher rating first
        }
        // If ratings are equal, sort by number of reviews
        const aReviews = a.user_ratings_total || 0;
        const bReviews = b.user_ratings_total || 0;
        return bReviews - aReviews; // More reviews first
      }
      
      // If only one has a rating, prioritize it
      if (a.rating && !b.rating) return -1;
      if (!a.rating && b.rating) return 1;
      
      // If neither has a rating, sort by number of reviews
      const aReviews = a.user_ratings_total || 0;
      const bReviews = b.user_ratings_total || 0;
      return bReviews - aReviews;
    });
  }, [workspaces]);

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const getPriceLevel = (priceLevel?: number) => {
    if (!priceLevel) return 'NaN';
    return '$'.repeat(priceLevel);
  };

  const getPhotoUrl = (photo: google.maps.places.PlacePhoto, maxWidth: number = 300) => {
    return photo.getUrl({ maxWidth });
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border-r border-orange-500/20 w-80 md:w-96 flex-shrink-0 p-4 h-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-300">Loading workspaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-black/40 backdrop-blur-xl border-r border-orange-500/20 w-80 md:w-96 flex-shrink-0 overflow-y-auto h-full pb-[2rem]"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#f97316 #1a1a1a'
      }}
    >
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-orange-500/20 flex items-center justify-between">
        <h2 className="text-base md:text-lg font-serif font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-wide">
          <span className="hidden sm:inline">Nearby Workspaces ({workspaceData.length})</span>
          <span className="sm:hidden">Workspaces ({workspaceData.length})</span>
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-400 hover:text-orange-400 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Workspace List */}
      <div className="divide-y divide-orange-500/10">
        {workspaceData.length === 0 ? (
          <div className="p-4 md:p-6 text-center">
            <MapPin className="w-12 h-12 text-orange-400/60 mx-auto mb-3" />
            <p className="text-gray-300 font-sans font-medium tracking-wide">No workspaces found in this area</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1 font-sans tracking-wide">Try adjusting your filters or search location</p>
          </div>
        ) : (
          workspaceData.map((workspace) => {
            const isSelected = workspace.place_id === selectedWorkspaceId;
            const details = workspaceDetails[workspace.place_id];
            const isLoadingPhoto = loadingDetails[workspace.place_id];
            const openStatus = openingStatus[workspace.place_id];
            
            // Try to get photos from multiple sources
            const availablePhotos = details?.photos || workspace.photos || [];
            
            return (
              <div
                key={workspace.place_id}
                onClick={() => onWorkspaceSelect(workspace.place_id)}
                className={`cursor-pointer transition-all duration-300 hover:bg-black/60 backdrop-blur-sm group ${
                  isSelected ? 'bg-orange-500/10 border-r-2 border-orange-500 shadow-lg shadow-orange-500/20' : ''
                }`}
              >
                {/* Photo */}
                {availablePhotos && availablePhotos.length > 0 ? (
                  <div className="px-3 md:px-4 pt-3 md:pt-4">
                    <div className="w-full aspect-video rounded-lg overflow-hidden">
                      <img
                        src={getPhotoUrl(availablePhotos[0])}
                        alt={workspace.name}
                        className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ) : isLoadingPhoto ? (
                  <div className="px-3 md:px-4 pt-3 md:pt-4">
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  </div>
                ) : null}

                <div className="p-3 md:p-4">
                {/* Workspace Name and Type */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif font-semibold text-white text-xs md:text-sm leading-tight pr-2 group-hover:text-orange-100 transition-colors duration-300 tracking-wide">
                    {workspace.name}
                  </h3>
                  <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-sans font-semibold flex-shrink-0 tracking-wide ${workspace.placeTypeColor}`}>
                    {workspace.placeTypeLabel}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-orange-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 leading-tight line-clamp-2 font-sans tracking-wide">
                    {workspace.formatted_address}
                  </p>
                </div>

                {/* Rating and Price */}
                <div className="flex items-center gap-3 mb-2">
                  {workspace.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs md:text-sm font-sans font-semibold text-white tracking-wide">
                        {formatRating(workspace.rating)}
                      </span>
                      {workspace.user_ratings_total && (
                        <span className="text-xs text-gray-400 font-sans tracking-wide">
                          ({workspace.user_ratings_total})
                        </span>
                      )}
                    </div>
                  )}

                  {workspace.price_level && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-orange-400/60" />
                      <span className="text-xs md:text-sm text-gray-300 font-sans font-medium tracking-wide">
                        {getPriceLevel(workspace.price_level)}
                      </span>
                    </div>
                  )}

                  {!workspace.rating && !workspace.price_level && (
                    <span className="text-xs md:text-sm text-gray-400 font-sans tracking-wide">Not yet rated</span>
                  )}
                </div>

                {/* Opening Status */}
                {openStatus && (
                  <div className="flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3 text-orange-400/60" />
                    <span className={`text-xs font-sans font-medium tracking-wide ${
                      openStatus.isOpen === true
                        ? 'text-green-400'
                        : openStatus.isOpen === false
                        ? 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {openStatus.text}
                    </span>
                  </div>
                )}

                {/* Recent Review */}
                {details?.reviews && details.reviews.length > 0 && (
                  <div className="mb-3 p-2 bg-black/60 backdrop-blur-sm rounded text-xs border border-orange-500/10">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2 h-2 ${
                            i < details.reviews[0].rating
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-gray-400 ml-1">
                        {details.reviews[0].author_name}
                      </span>
                    </div>
                    <p className="text-gray-300 line-clamp-2 font-sans tracking-wide">
                      {details.reviews[0].text}
                    </p>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWorkspaceSelect(workspace.place_id);
                  }}
                  className="w-full text-center py-2 text-xs md:text-sm font-sans font-semibold text-white bg-[#F97316] border border-orange-500/20 rounded hover:bg-orange-600 hover:border-orange-500/40 transition-all duration-300 hover:scale-105 transform shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 tracking-wide"
                >
                  View Details
                </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkspaceList;