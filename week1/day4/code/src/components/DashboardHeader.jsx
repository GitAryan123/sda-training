import React from 'react';
import PropTypes from 'prop-types';

export function DashboardHeader({
  filters,
  onFilterChange,
  onRefresh,
  viewMode,
  onViewModeChange
}) {
  return (
    <div className="dashboard-header-controls">
      <div className="header-actions">
        <div className="filter-group">
          <label htmlFor="date-range-filter" className="filter-label">Date Range</label>
          <select 
            id="date-range-filter"
            value={filters.dateRange} 
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="filter-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <label htmlFor="category-filter" className="filter-label">Category</label>
          <select 
            id="category-filter"
            value={filters.category} 
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="enterprise">Enterprise</option>
            <option value="consumer">Consumer</option>
          </select>
        </div>
        
        <div className="mode-toggle">
          <button 
            onClick={() => onViewModeChange('grid')} 
            className={`btn btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
          >
            Grid
          </button>
          <button 
            onClick={() => onViewModeChange('list')} 
            className={`btn btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
          >
            List
          </button>
        </div>

        <button onClick={onRefresh} className="btn btn-primary">
          ↻ Refresh Telemetry
        </button>
      </div>
    </div>
  );
}

DashboardHeader.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired
};
