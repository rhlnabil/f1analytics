import { createContext, useContext } from 'react';

/* ============================================================ */
/* ============ STUB — Feature Badges désactivée ============== */
/* ============================================================ */

const NOOP = () => {};

const BadgeContext = createContext({
  badges: {},
  images: {},
  driverAssignments: {},
  unlock: NOOP,
  has: () => false,
  getPhoto: () => null,
  getMeta: () => ({}),
  getRarity: () => 'common',
  refreshImages: NOOP,
  count: 0,
  total: 0,
  loading: false,
  reset: NOOP,
  trackGamePlayed: () => [],
  gamesPlayed: [],
  getAssignment: () => null,
  rerollAssignment: NOOP,
});

export const ALL_GAMES = [];

export function BadgeProvider({ children }) {
  return (
    <BadgeContext.Provider value={{
      badges: {},
      images: {},
      driverAssignments: {},
      unlock: NOOP,
      has: () => false,
      getPhoto: () => null,
      getMeta: () => ({}),
      getRarity: () => 'common',
      refreshImages: NOOP,
      count: 0,
      total: 0,
      loading: false,
      reset: NOOP,
      trackGamePlayed: () => [],
      gamesPlayed: [],
      getAssignment: () => null,
      rerollAssignment: NOOP,
    }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  return useContext(BadgeContext);
}