# API Integration Guide

## Overview
This document summarizes how I implemented API integration and real-time data handling in Day 5.  
The goal was to build a reliable data layer for dashboard metrics using REST APIs for initial data and WebSockets for live updates.

## REST API Best Practices
- Used correct HTTP methods for each operation:
  - GET for reading data
  - POST for creating data
  - PUT for full updates
  - DELETE for removal
- Centralized API logic in a service class to avoid repeated fetch code.
- Added request timeout handling using AbortController.
- Implemented retry logic for temporary failures (timeouts and 5xx errors).
- Added in-memory caching with TTL to reduce unnecessary requests.
- Standardized JSON headers and response parsing.
- Used try/catch for error handling and surfaced clear error messages to UI.

## Error Handling and Reliability
- Handled transient errors with exponential backoff retries.
- Avoided retrying non-recoverable errors.
- Logged failures for debugging.
- Returned controlled errors to components instead of crashing the app.
- Added manual refresh to recover quickly from stale or failed requests.

## WebSocket Implementation
- Built a WebSocket service for real-time events.
- Managed connection lifecycle:
  - connect
  - listen
  - disconnect
  - reconnect
- Implemented heartbeat (ping/pong) to keep connection alive.
- Added reconnection with max attempt limits.
- Queued outgoing messages while offline and sent them after reconnect.
- Used event-based subscriptions for clean message handling.

## Real-Time Data Strategy
- Fetched initial snapshot from REST API.
- Subscribed to WebSocket messages for live updates.
- Merged incremental updates into existing state.
- Tracked connection state and displayed:
  - Connected
  - Partial connection
  - Disconnected
- Added optional auto-refresh for periodic consistency checks.

## Performance Considerations
- Used caching to reduce duplicate API calls.
- Refreshed data only when needed.
- Avoided full data reload for every live update.
- Kept socket message handling lightweight.
- Used reusable hooks to keep components focused on UI.

