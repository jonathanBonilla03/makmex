import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [availableLocations, setAvailableLocations] = useState([]);

  const toggleLocation = useCallback((location) => {
    setSelectedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(location)) next.delete(location);
      else next.add(location);
      return next;
    });
  }, []);

  const clearLocations = useCallback(() => {
    setSelectedLocations(new Set());
  }, []);

  const updateAvailableLocations = useCallback((locations) => {
    const uniqueSorted = Array.from(new Set((locations || []).filter(Boolean))).sort();
    setAvailableLocations((prev) => {
      if (prev.length === uniqueSorted.length && prev.every((value, index) => value === uniqueSorted[index])) {
        return prev;
      }
      return uniqueSorted;
    });
  }, []);

  const value = useMemo(() => ({
    selectedLocations,
    availableLocations,
    toggleLocation,
    clearLocations,
    updateAvailableLocations
  }), [selectedLocations, availableLocations, toggleLocation, clearLocations, updateAvailableLocations]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
}
