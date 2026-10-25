import { createContext, useContext } from 'react';

const CursorContext = createContext({
  setCursorColor: () => {},
  resetCursorColor: () => {},
});

export function CursorProvider({ children }) {
  return (
    <CursorContext.Provider
      value={{
        setCursorColor: () => {},
        resetCursorColor: () => {},
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  return useContext(CursorContext);
}