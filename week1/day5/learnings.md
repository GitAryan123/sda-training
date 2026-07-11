# Day 5 Learnings: API Integration and Real-Time Data

## What I Learned

Today I learned how to build a stronger data layer in React by combining REST APIs with WebSocket updates.

1. I learned how to design an API service class that handles:
- common HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)
- centralized error handling
- request timeout using `AbortController`
- retry logic with exponential backoff
- response caching with TTL using `Map`

2. I learned why retry should be selective.
- transient failures like timeouts and `5xx` errors can be retried
- permanent failures should fail fast

3. I learned how to manage WebSocket communication in a service layer.
- connect/disconnect lifecycle
- message parsing and event-based handling
- reconnection strategy with max attempts
- heartbeat (`ping/pong`) to keep connection alive
- queueing messages until connection is restored

4. I learned how to combine initial API fetch with real-time updates in a custom hook.
- load initial snapshot from API
- subscribe to socket events for live patches
- update local state incrementally without full refetch
- expose `loading`, `error`, `isConnected`, and manual `refresh`

5. I learned dashboard-level coordination for multiple data sources.
- track per-widget connection state
- compute global connection status (`connected`, `partial`, `disconnected`)
- support manual refresh + periodic auto-refresh
- show meaningful connection feedback to users

## Key Technical Concepts I Practiced

- Service layer pattern for APIs and sockets
- Separation of concerns between data logic and UI components
- Real-time UX patterns (status indicators, last update time, fallback states)
- Resilience patterns (timeouts, retries, reconnects, queues)

