import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export function ConnectionStatus({ status, latency, onReconnect }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (status === 'connected') {
      setLastUpdate(new Date());
    }
  }, [status]);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '🟢',
          text: 'Live Connection',
          color: '#10b981',
          bg: '#ecfdf5',
          description: 'Telemetry streams active. Live syncing via WebSocket channel.'
        };
      case 'partial':
        return {
          icon: '🟡',
          text: 'Unstable Connection',
          color: '#f59e0b',
          bg: '#fffbeb',
          description: 'Partial packet losses observed. Retrying channels.'
        };
      case 'disconnected':
        return {
          icon: '🔴',
          text: 'Channel Offline',
          color: '#ef4444',
          bg: '#fef2f2',
          description: 'Websocket pipe closed. Real-time updates paused.'
        };
      default:
        return {
          icon: '⚪',
          text: 'Unknown Link',
          color: '#6b7280',
          bg: '#f8fafc',
          description: 'Verifying socket endpoints...'
        };
    }
  };

  const info = getStatusInfo();

  return (
    <div 
      className="connection-status-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(prev => !prev)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <div 
        className={`status-badge-container status-${status}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          background: info.bg,
          border: `1px solid ${info.color}25`,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: info.color,
          transition: 'all 0.2s ease'
        }}
      >
        <span>{info.icon}</span>
        <span>{info.text}</span>
        {status === 'connected' && latency !== undefined && (
          <span className="latency-indicator" style={{ opacity: 0.75, fontFamily: 'monospace' }}>
            ({latency}ms)
          </span>
        )}
      </div>

      {showTooltip && (
        <div 
          className="connection-tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '0.75rem',
            zIndex: 9999,
            fontSize: '0.75rem',
            color: '#1e293b',
            animation: 'fadeInUp 0.15s ease'
          }}
        >
          <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{info.description}</p>
          
          {lastUpdate && (
            <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.7rem' }}>
              Last sync: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          {status === 'disconnected' && onReconnect && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onReconnect();
              }}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.3rem',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Force Reconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ConnectionStatus.propTypes = {
  status: PropTypes.oneOf(['connected', 'partial', 'disconnected', 'unknown']).isRequired,
  latency: PropTypes.number,
  onReconnect: PropTypes.func
};
