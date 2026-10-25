import { createContext, useContext, useEffect, useCallback } from 'react';

const DEFAULT_COLOR = '#e10600';

/* ============================================================ */
/* ==================== SVG CURSOR BUILDER ==================== */
/* ============================================================ */

function buildArrowSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><path d="M5 2 L5 22 L10 17 L14 24 L17 22 L13 15 L20 15 Z" fill="${color}" stroke="#000000" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
}

function buildPointerSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><circle cx="5" cy="2" r="7" fill="${color}" opacity="0.15"/><circle cx="5" cy="2" r="4" fill="${color}" opacity="0.3"/><path d="M5 2 L5 22 L10 17 L14 24 L17 22 L13 15 L20 15 Z" fill="${color}" stroke="#000000" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
}

function svgToUrl(svg) {
  const base64 = window.btoa(svg);
  return `url("data:image/svg+xml;base64,${base64}")`;
}

/* ============================================================ */
/* ============ INJECTION DES STYLES DANS LE <head> =========== */
/* ============================================================ */

function injectCursorStyles(color) {
  const c = color || DEFAULT_COLOR;

  const arrowUrl   = svgToUrl(buildArrowSvg(c));
  const pointerUrl = svgToUrl(buildPointerSvg(c));

  let styleEl = document.getElementById('f1-cursor-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'f1-cursor-style';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    html, body {
      cursor: ${arrowUrl} 5 2, auto !important;
    }
    a, button, [role="button"], [role="link"], [role="tab"],
    [role="menuitem"], [role="option"], summary, label[for],
    select, input[type="checkbox"], input[type="radio"],
    input[type="submit"], input[type="button"], input[type="file"] {
      cursor: ${pointerUrl} 5 2, pointer !important;
    }
    input[type="text"], input[type="email"], input[type="password"],
    input[type="number"], input[type="search"], input[type="tel"],
    input[type="url"], input[type="date"], input[type="time"], textarea {
      cursor: text !important;
    }
    button:disabled, input:disabled, select:disabled,
    textarea:disabled, [disabled] {
      cursor: not-allowed !important;
    }
  `;
}

/* ============================================================ */
/* ==================== CONTEXT PROVIDER ======================= */
/* ============================================================ */

const CursorContext = createContext({
  setCursorColor: () => {},
  resetCursorColor: () => {},
});

export function CursorProvider({ children }) {
  const setCursorColor = useCallback((color) => {
    injectCursorStyles(color);
  }, []);

  const resetCursorColor = useCallback(() => {
    injectCursorStyles(DEFAULT_COLOR);
  }, []);

  useEffect(() => {
    injectCursorStyles(DEFAULT_COLOR);
  }, []);

  return (
    <CursorContext.Provider value={{ setCursorColor, resetCursorColor }}>
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  return useContext(CursorContext);
}