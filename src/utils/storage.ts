import { Filters } from '../types';

const STORAGE_KEYS = {
  FILTERS: 'workspace-finder-filters',
  FAVORITES: 'workspace-finder-favorites'
};

export const saveFilters = (filters: Filters): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

export const loadFilters = (): Filters | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
    return null;
  }
};

export const saveFavorite = (placeId: string): void => {
  try {
    const favorites = loadFavorites();
    if (!favorites.includes(placeId)) {
      favorites.push(placeId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.warn('Failed to save favorite to localStorage:', error);
  }
};

export const removeFavorite = (placeId: string): void => {
  try {
    const favorites = loadFavorites();
    const updated = favorites.filter(id => id !== placeId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to remove favorite from localStorage:', error);
  }
};

export const loadFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load favorites from localStorage:', error);
    return [];
  }
};

export const isFavorite = (placeId: string): boolean => {
  return loadFavorites().includes(placeId);
};