import React from 'react';
import PropTypes from 'prop-types';

export const MetricsCard = React.memo(function MetricsCard({ 
  title, 
  value, 
  change, 
  loading, 
  error, 
  icon 
}) {
  if (loading) {
    return (
      <div className="metrics-card loading">
        <div className="card-skeleton-title"></div>
        <div className="card-skeleton-value"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-card error">
        <p className="card-error-text">Failed to load {title}</p>
      </div>
    );
  }

  const isPositive = change >= 0;

  return (
    <div className="metrics-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
      </div>
      <div className="card-content">
        <span className="card-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲ +' : '▼ '}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
});

MetricsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  icon: PropTypes.string
};
