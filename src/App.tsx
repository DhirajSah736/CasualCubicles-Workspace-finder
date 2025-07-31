import React, { useState, useEffect } from 'react';
import { Location, Filters, Workspace } from './types';
import { loadGoogleMapsScript } from './utils/googleMaps';
import { getCurrentLocation } from './utils/geolocation';
import { loadFilters, saveFilters } from './utils/storage';
import Header from './components/Header';
import WorkspaceList from './components/WorkspaceList';
import MapContainer from './components/MapContainer';
import FilterPanel from './components/FilterPanel';
import WorkspacePanel from './components/WorkspacePanel';
import Footer from './components/Footer';
import { AlertCircle, Loader } from 'lucide-react';

const DEFAULT_FILTERS: Filters = {
  distance: 1000,
  rating: 0,
  placeType: 'all',
  openNow: false
};

function App() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [navigationDestination, setNavigationDestination] = useState<Location | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchLocation, setSearchLocation] = useState<Location | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isWorkspaceListOpen, setIsWorkspaceListOpen] = useState(false);

  // Load saved filters
  useEffect(() => {
    const savedFilters = loadFilters();
    if (savedFilters) {
      setFilters(savedFilters);
    }
  }, []);

  // Save filters when they change
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load Google Maps script
        await loadGoogleMapsScript();
        setIsScriptLoaded(true);

        // Request location permission and get current location
        const location = await getCurrentLocation();
        setUserLocation(location);
        setLocationError(null);
      } catch (error) {
        console.error('Initialization error:', error);
        if (error instanceof Error) {
          setLocationError(error.message);
        } else {
          setLocationError('Failed to initialize the application');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleLocationSelect = (location: Location, address: string) => {
    if (location.lat === 0 && location.lng === 0 && address === '') {
      // Clear search
      setSearchLocation(null);
      setSearchAddress('');
    } else {
      setSearchLocation(location);
      setSearchAddress(address);
    }
  };

  const handleWorkspacesUpdate = (newWorkspaces: Workspace[], loading: boolean) => {
    setWorkspaces(newWorkspaces);
    setWorkspacesLoading(loading);
    
    // Update map markers when workspaces change
    if (!loading && (window as any).updateMapMarkers) {
      (window as any).updateMapMarkers(newWorkspaces);
    }
  };

  const handleWorkspaceSelect = (placeId: string) => {
    setSelectedWorkspace(placeId);
    setIsWorkspacePanelOpen(true);
    setIsWorkspaceListOpen(false); // Close workspace list on mobile
  };

  const handleWorkspacePanelClose = () => {
    setSelectedWorkspace(null);
    setIsWorkspacePanelOpen(false);
    setNavigationDestination(null);
  };

  const handleNavigate = (destination: Location) => {
    setNavigationDestination(destination);
  };

  const handleNavigationComplete = () => {
    // Navigation setup complete
  };

  const handleLocationRetry = async () => {
    setIsInitializing(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      if (error instanceof Error) {
        setLocationError(error.message);
      } else {
        setLocationError('Failed to get your location');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Setting up Workspace Finder
            </h2>
            <p className="text-gray-300">
              Loading maps and requesting location access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Location error state
  if (locationError || !userLocation || !isScriptLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-black/40 backdrop-blur-xl rounded-full border border-orange-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-wide">
              Location Access Required
            </h2>
            <p className="text-gray-300 font-sans font-medium tracking-wide">
              {locationError || 'We need your location to find nearby workspaces.'}
            </p>
          </div>

          <button
            onClick={handleLocationRetry}
            className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-sans font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transform tracking-wide"
          >
            Allow Location Access
          </button>

          <p className="text-xs text-gray-400 leading-relaxed font-sans tracking-wide">
            Your location is only used to find nearby workspaces and is not stored or shared. 
            You can revoke this permission at any time in your browser settings.
          </p>
        </div>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersToggle={() => setIsFilterPanelOpen(true)}
        onLocationSelect={handleLocationSelect}
        onWorkspaceListToggle={() => setIsWorkspaceListOpen(!isWorkspaceListOpen)}
        workspaceCount={workspaces.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative" style={{ height: 'calc(100vh - 104px)' }}>
        {/* Mobile Workspace List Overlay */}
        <div className={`
          fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          md:hidden
          ${isWorkspaceListOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `} onClick={() => setIsWorkspaceListOpen(false)} />
        
        {/* Workspace List Sidebar */}
        <div className={`
          fixed left-0 top-16 bottom-0 z-40 transform transition-transform duration-300 ease-in-out
          md:relative md:top-0 md:transform-none md:transition-none
          ${isWorkspaceListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <WorkspaceList
            workspaces={workspaces}
            onWorkspaceSelect={handleWorkspaceSelect}
            selectedWorkspaceId={selectedWorkspace}
            loading={workspacesLoading}
            onClose={() => setIsWorkspaceListOpen(false)}
          />
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            userLocation={searchLocation || userLocation}
            filters={filters}
            searchQuery={searchQuery}
            searchAddress={searchAddress}
            onWorkspaceSelect={handleWorkspaceSelect}
            onWorkspacesUpdate={handleWorkspacesUpdate}
            navigationDestination={navigationDestination}
            onNavigationComplete={handleNavigationComplete}
            onLocationChange={setSearchLocation}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
        />
      )}

      {/* Workspace Details Panel */}
      {isWorkspacePanelOpen && (
        <WorkspacePanel
          placeId={selectedWorkspace}
          userLocation={userLocation}
          onClose={handleWorkspacePanelClose}
          onNavigate={handleNavigate}
          isOpen={isWorkspacePanelOpen}
        />
      )}
    </div>
  );
}

export default App;