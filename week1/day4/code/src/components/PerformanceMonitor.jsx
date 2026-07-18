import React from 'react';
import { usePerformance } from '../hooks/usePerformance';

export function PerformanceMonitor() {
  const metrics = usePerformance();

  return (
    <div className="performance-panel-react">
      <div className="panel-header">
        <h3>Core Web Vitals & Timings</h3>
        <span className="active-dot"></span>
      </div>
      <div className="metrics-list">
        <div className="metric-item">
          <div className="metric-info">
            <span className="metric-name">Largest Contentful Paint (LCP)</span>
            <span className="metric-time">First Paint rendering time</span>
          </div>
          <div className="metric-badge">
            {metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint.toFixed(2)} ms` : 'N/A'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-info">
            <span className="metric-name">First Paint (FP)</span>
            <span className="metric-time">First visual change</span>
          </div>
          <div className="metric-badge">
            {metrics.firstPaint ? `${metrics.firstPaint.toFixed(2)} ms` : 'N/A'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-info">
            <span className="metric-name">DOMContentLoaded</span>
            <span className="metric-time">DOM parsed milestone</span>
          </div>
          <div className="metric-badge">
            {metrics.domContentLoaded ? `${metrics.domContentLoaded.toFixed(2)} ms` : '0 ms'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-info">
            <span className="metric-name">Page Load Event</span>
            <span className="metric-time">Total network loading delay</span>
          </div>
          <div className="metric-badge">
            {metrics.loadTime ? `${metrics.loadTime.toFixed(2)} ms` : '0 ms'}
          </div>
        </div>
      </div>
    </div>
  );
}
