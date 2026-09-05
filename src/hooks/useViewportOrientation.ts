'use client';

import { useState, useEffect } from 'react';

interface ViewportState {
  isLandscape: boolean;
  isMobile: boolean;
  viewportWidth: number;
  viewportHeight: number;
}

export function useViewportOrientation(): ViewportState {
  const [state, setState] = useState<ViewportState>({
    isLandscape: true, // safe default for desktop/table
    isMobile: false,
    viewportWidth: 1200,
    viewportHeight: 800,
  });

  useEffect(() => {
    const updateViewport = () => {
      // Use visualViewport if available (gives exact visible height excluding mobile keyboard/bars)
      const w = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      // On phones, landscape is when width > height OR when height is very small (<= 520px)
      const landscape = w > h || h <= 520;
      const mobile = w < 768 || h <= 550;

      setState({
        isLandscape: landscape,
        isMobile: mobile,
        viewportWidth: w,
        viewportHeight: h,
      });
    };

    updateViewport();

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      }
    };
  }, []);

  return state;
}
