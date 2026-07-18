import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

export function ChartContainer({ data, selectedMetric, onMetricChange }) {
  const currentDataset = useMemo(() => {
    return data[selectedMetric] || { labels: [], values: [] };
  }, [data, selectedMetric]);

  // Compute Line chart vector path coordinates
  const lineChartPath = useMemo(() => {
    if (selectedMetric !== 'revenue' || !currentDataset.values || currentDataset.values.length === 0) {
      return { line: '', area: '', points: [] };
    }
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

  // Compute Bar chart vector configurations
  const barChartItems = useMemo(() => {
    if (selectedMetric !== 'users' || !currentDataset.values || currentDataset.values.length === 0) {
      return [];
    }
    const values = currentDataset.values;
    const max = Math.max(...values, 1);
    const width = 500;
    const height = 180;
    const padding = 20;

    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const barWidth = (chartWidth / values.length) * 0.6;
    const barGap = (chartWidth / values.length) * 0.4;

    return values.map((val, index) => {
      const barHeight = (val / max) * chartHeight;
      const x = padding + index * (barWidth + barGap) + barGap / 2;
      const y = height - padding - barHeight;
      return { x, y, width: barWidth, height: barHeight, val };
    });
  }, [selectedMetric, currentDataset]);

  // Compute Doughnut chart vector sectors
  const donutChartSlices = useMemo(() => {
    if (selectedMetric !== 'orders' || !currentDataset.values || currentDataset.values.length === 0) {
      return [];
    }
    const values = currentDataset.values;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const centerX = 250;
    const centerY = 90;
    const radius = 65;
    let accumulatedAngle = 0;

    const colors = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#c084fc', '#e879f9'];

    return values.map((val, index) => {
      const percentage = val / total;
      const angle = percentage * 360;

      // Coordinate computations for polar arcs
      const radStart = ((accumulatedAngle - 90) * Math.PI) / 180;
      const radEnd = ((accumulatedAngle + angle - 90) * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(radStart);
      const y1 = centerY + radius * Math.sin(radStart);
      const x2 = centerX + radius * Math.cos(radEnd);
      const y2 = centerY + radius * Math.sin(radEnd);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      accumulatedAngle += angle;

      return {
        path: pathData,
        fill: colors[index % colors.length],
        label: currentDataset.labels[index],
        val
      };
    });
  }, [selectedMetric, currentDataset]);

  return (
    <div className="chart-container-wrapper">
      <div className="chart-header">
        <h3>Metrics Visualization</h3>
        <div className="metric-tabs">
          <button 
            onClick={() => onMetricChange('revenue')} 
            className={`tab-btn ${selectedMetric === 'revenue' ? 'active' : ''}`}
          >
            Revenue
          </button>
          <button 
            onClick={() => onMetricChange('users')} 
            className={`tab-btn ${selectedMetric === 'users' ? 'active' : ''}`}
          >
            Users
          </button>
          <button 
            onClick={() => onMetricChange('orders')} 
            className={`tab-btn ${selectedMetric === 'orders' ? 'active' : ''}`}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="svg-chart-viewport">
        {currentDataset.values && currentDataset.values.length === 0 ? (
          <div className="empty-chart-state" style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
            No telemetry data loaded.
          </div>
        ) : (
          <svg viewBox="0 0 500 200" className="svg-canvas" style={{ width: '100%', height: '100%' }}>
            {/* Render Grid Lines */}
            {selectedMetric !== 'orders' && (
              <g stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 3">
                <line x1="20" y1="20" x2="480" y2="20" />
                <line x1="20" y1="60" x2="480" y2="60" />
                <line x1="20" y1="100" x2="480" y2="100" />
                <line x1="20" y1="140" x2="480" y2="140" />
                <line x1="20" y1="160" x2="480" y2="160" strokeWidth="1" strokeDasharray="0" />
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
                    <text x={p.x} y="175" textAnchor="middle" className="axis-label" style={{ fontSize: '8px', fill: '#64748b' }}>
                      {currentDataset.labels[idx]}
                    </text>
                    <text x={p.x} y={p.y - 8} textAnchor="middle" className="point-label" style={{ fontSize: '7px', fontWeight: 700, fill: '#1e293b' }}>
                      ${currentDataset.values[idx]?.toLocaleString()}
                    </text>
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
                  fill="#818cf8" 
                  rx="3" 
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text x={bar.x + bar.width / 2} y="175" textAnchor="middle" className="axis-label" style={{ fontSize: '8px', fill: '#64748b' }}>
                  {currentDataset.labels[idx]}
                </text>
                <text x={bar.x + bar.width / 2} y={bar.y - 8} textAnchor="middle" className="point-label" style={{ fontSize: '7px', fontWeight: 700, fill: '#1e293b' }}>
                  {bar.val}
                </text>
              </g>
            ))}

            {/* Render Doughnut Chart */}
            {selectedMetric === 'orders' && (
              <g>
                {donutChartSlices.map((slice, idx) => (
                  <path 
                    key={idx} 
                    d={slice.path} 
                    fill={slice.fill} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />
                ))}
                {/* Center cut-out circle */}
                <circle cx="250" cy="90" r="40" fill="#ffffff" />
                <text x="250" y="87" textAnchor="middle" className="donut-center-title" style={{ fontSize: '9px', fontWeight: 700, fill: '#1e293b' }}>
                  ORDERS
                </text>
                <text x="250" y="98" textAnchor="middle" style={{ fontSize: '8px', fill: '#64748b', fontWeight: 600 }}>
                  {currentDataset.values.reduce((a, b) => a + b, 0)} total
                </text>

                {/* Legends */}
                {donutChartSlices.map((slice, idx) => {
                  const legendX = idx < 4 ? 30 : 380;
                  const legendY = 35 + (idx % 4) * 28;
                  return (
                    <g key={idx}>
                      <rect x={legendX} y={legendY - 6} width="10" height="10" rx="2" fill={slice.fill} />
                      <text x={legendX + 15} y={legendY} className="legend-label" style={{ fontSize: '8px', fill: '#64748b', fontWeight: 600 }}>
                        {slice.label}: {slice.val}
                      </text>
                    </g>
                  );
                })}
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
