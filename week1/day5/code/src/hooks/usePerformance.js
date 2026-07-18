import { useState, useEffect } from 'react';

export function usePerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigations = performance.getEntriesByType('navigation');
        const navigation = navigations && navigations.length > 0 ? navigations[0] : null;
        
        const paints = performance.getEntriesByType('paint') || [];
        const fp = paints.find(entry => entry.name === 'first-paint')?.startTime || 0;
        const fcp = paints.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        
        setMetrics({
          loadTime: navigation ? Math.max(0, navigation.loadEventEnd - navigation.loadEventStart) : 0,
          domContentLoaded: navigation ? Math.max(0, navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
          firstPaint: Math.round(fp),
          firstContentfulPaint: Math.round(fcp)
        });
      }
    };

    updateMetrics();
    
    const loadHandler = () => setTimeout(updateMetrics, 200);
    window.addEventListener('load', loadHandler);
    
    const interval = setInterval(updateMetrics, 5000);
    return () => {
      window.removeEventListener('load', loadHandler);
      clearInterval(interval);
    };
  }, []);

  return metrics;
}
