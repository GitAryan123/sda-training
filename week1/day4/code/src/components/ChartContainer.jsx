import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

export function ChartContainer({ data, selectedMetric, onMetricChange }) {
  const currentDataset = useMemo(() => {
    return data[selectedMetric] || { labels: [], values: [] };
  }, [data, selectedMetric]);

  // Calculations for Line Chart (Revenue)
  const lineChartPath = useMemo(() => {
    if (selectedMetric !== 'revenue' || currentDataset.values.length === 0) return { line: '', area: '' };
    const values = currentDataset.values;
    const max = Math.max(...values, 1);
    const width = 500;
    const height = 180;
    const padding = 20;

    const points = values.map((val, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - (val / max) * (height - 2 * padding);
      return { x, y };
    });

    const linePath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return { line: linePath, area: areaPath, points };
  }, [selectedMetric, currentDataset]);

  // Calculations for Bar Chart (Users)
  const barChartItems = useMemo(() => {
    if (selectedMetric !== 'users' || currentDataset.values.length === 0) return [];
    const values = currentDataset.values;
    const max = Math.max(...values, 1);
    const width = 500;
    const height = 180;
    const padding = 25;
    const barWidth = 30;

    return values.map((val, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding - barWidth);
      const barHeight = (val / max) * (height - 2 * padding);
      const y = height - padding - barHeight;
      return { x, y, width: barWidth, height: barHeight, value: val };
    });
  }, [selectedMetric, currentDataset]);

  // Calculations for Doughnut Chart (Orders)
  const doughnutSlices = useMemo(() => {
    if (selectedMetric !== 'orders' || currentDataset.values.length === 0) return [];
    const values = currentDataset.values;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const radius = 60;
    const cx = 200;
    const cy = 90;
    
    let accumulatedAngle = -Math.PI / 2; // Start from top
    const colors = ['#4f46e5', '#f59e0b', '#ff6b6b'];

    return values.map((val, index) => {
      const percentage = val / total;
      const angle = percentage * 2 * Math.PI;
      
      // Calculate arc endpoints
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      
      const pathData = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      `;

      return {
        path: pathData,
        color: colors[index % colors.length],
        label: currentDataset.labels[index],
        value: val,
        percentage: (percentage * 100).toFixed(1)
      };
    });
  }, [selectedMetric, currentDataset]);

  return (
    <div className="chart-container-wrapper">
      <div className="chart-header">
        <h3>Metrics Visualization</h3>
        <div className="metric-tabs">
          <button 
            className={`tab-btn ${selectedMetric === 'revenue' ? 'active' : ''}`}
            onClick={() => onMetricChange('revenue')}
          >
            Revenue
          </button>
          <button 
            className={`tab-btn ${selectedMetric === 'users' ? 'active' : ''}`}
            onClick={() => onMetricChange('users')}
          >
            Users
          </button>
          <button 
            className={`tab-btn ${selectedMetric === 'orders' ? 'active' : ''}`}
            onClick={() => onMetricChange('orders')}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="svg-chart-viewport">
        {currentDataset.values.length === 0 ? (
          <div className="empty-chart-state">No telemetry data.</div>
        ) : (
          <svg viewBox="0 0 500 200" className="svg-canvas">
            {/* Draw grid lines for Line/Bar charts */}
            {(selectedMetric === 'revenue' || selectedMetric === 'users') && (
              <g className="grid-lines">
                <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(100, 116, 139, 0.1)" strokeDasharray="4 4" />
                <line x1="20" y1="65" x2="480" y2="65" stroke="rgba(100, 116, 139, 0.1)" strokeDasharray="4 4" />
                <line x1="20" y1="110" x2="480" y2="110" stroke="rgba(100, 116, 139, 0.1)" strokeDasharray="4 4" />
                <line x1="20" y1="160" x2="480" y2="160" stroke="rgba(100, 116, 139, 0.1)" />
              </g>
            )}

            {/* Render Line Chart */}
            {selectedMetric === 'revenue' && lineChartPath.points && (
              <g>
                <path d={lineChartPath.area} fill="rgba(79, 70, 229, 0.08)" />
                <path d={lineChartPath.line} fill="none" stroke="#4f46e5" strokeWidth="3.5" strokeLinecap="round" />
                {lineChartPath.points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" />
                    <text x={p.x} y="175" textAnchor="middle" className="axis-label">{currentDataset.labels[idx]}</text>
                    <text x={p.x} y={p.y - 8} textAnchor="middle" className="point-label">${currentDataset.values[idx]}</text>
                  </g>
                ))}
              </g>
            )}

            {/* Render Bar Chart */}
            {selectedMetric === 'users' && barChartItems.map((bar, idx) => (
              <g key={idx}>
                <rect 
                  x={bar.x} 
                  y={bar.y} 
                  width={bar.width} 
                  height={bar.height} 
                  fill="#10b981" 
                  rx="4" 
                />
                <text x={bar.x + bar.width / 2} y="175" textAnchor="middle" className="axis-label">{currentDataset.labels[idx]}</text>
                <text x={bar.x + bar.width / 2} y={bar.y - 6} textAnchor="middle" className="point-label">{bar.value}</text>
              </g>
            ))}

            {/* Render Doughnut Chart */}
            {selectedMetric === 'orders' && (
              <g>
                {doughnutSlices.map((slice, idx) => (
                  <path 
                    key={idx} 
                    d={slice.path} 
                    fill="none" 
                    stroke={slice.color} 
                    strokeWidth="20" 
                  />
                ))}
                {/* Center label */}
                <circle cx="200" cy="90" r="48" fill="#ffffff" />
                <text x="200" y="93" textAnchor="middle" className="donut-center-title">Orders</text>
                
                {/* Legend items */}
                {doughnutSlices.map((slice, idx) => (
                  <g key={`legend-${idx}`} transform={`translate(310, ${45 + idx * 24})`}>
                    <rect width="12" height="12" fill={slice.color} rx="3" />
                    <text x="18" y="10" className="legend-label">{slice.label}: {slice.value} ({slice.percentage}%)</text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

ChartContainer.propTypes = {
  data: PropTypes.object.isRequired,
  selectedMetric: PropTypes.string.isRequired,
  onMetricChange: PropTypes.func.isRequired
};
