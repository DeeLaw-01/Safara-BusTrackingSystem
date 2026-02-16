import { create } from 'zustand';
import type { BusLocation } from '../types';

interface BusState {
  // Live bus locations indexed by busId
  busLocations: Map<string, BusLocation>;
  
  // Currently tracked route
  trackedRouteId: string | null;

  // Actions
  updateBusLocation: (location: BusLocation) => void;
  removeBus: (busId: string) => void;
  setTrackedRoute: (routeId: string | null) => void;
  clearLocations: () => void;
  getBusesOnRoute: (routeId: string) => BusLocation[];
}

export const useBusStore = create<BusState>((set, get) => ({
  busLocations: new Map(),
  trackedRouteId: null,

  updateBusLocation: (location) => {
    set((state) => {
      const newMap = new Map(state.busLocations);
      newMap.set(location.busId, location);
      return { busLocations: newMap };
    });
  },

  removeBus: (busId) => {
    set((state) => {
      const newMap = new Map(state.busLocations);
      newMap.delete(busId);
      return { busLocations: newMap };
    });
  },

  setTrackedRoute: (routeId) => {
    set({ trackedRouteId: routeId });
  },

  clearLocations: () => {
    set({ busLocations: new Map() });
  },

  getBusesOnRoute: (routeId) => {
    const locations = get().busLocations;
    return Array.from(locations.values()).filter(loc => loc.routeId === routeId);
  },
}));
