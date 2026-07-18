# Day 4 Learnings

Based on today’s tasks, this is what I learned:

## 1. React Hooks for Real Application State
- I used useState for simple UI state like selected metric and view mode.
- I used useEffect for side effects such as data loading, subscriptions, and cleanup.
- I understood dependency arrays better and how missing dependencies can cause stale or repeated behavior.
- I used useReducer for complex dashboard state transitions instead of many separate states.

## 2. Reducer-Based State Management
- I learned to model state changes with clear action types like loading, error, set data, and update filters.
- I understood that reducers improve predictability because all state transitions are centralized.
- I practiced dispatch-driven updates, which made the data flow easier to debug and maintain.

## 3. Context API for Shared Data Logic
- I learned to use context providers to share fetch logic and cache across components.
- I understood how context helps avoid prop drilling in deeper component trees.
- I used a provider pattern to expose fetchData, cache handling, and shared loading and error status.

## 4. Custom Hooks for Reusable Logic
- I created reusable hooks for common logic:
- useDataFetching for API lifecycle management
- useLocalStorage for persistent client state
- useDebounce for controlled updates during fast input
- usePerformance for tracking runtime metrics
- I learned that custom hooks keep components cleaner and easier to test.

## 5. Error Handling and Resilience
- I implemented explicit loading and error UI states for better user feedback.
- I learned to combine retry patterns with async handlers for failure recovery.
- I understood the role of Error Boundaries in preventing full app crashes from component errors.

## 6. Performance Optimization in React
- I learned why memoization tools matter:
- React.memo for component render optimization
- useMemo for expensive computed values
- useCallback for stable function references
- I practiced reducing unnecessary re-renders in chart-heavy dashboard sections.
- I also learned to use debouncing and timed updates for smoother UI performance.

## 7. Component Architecture and Data Flow
- I designed a cleaner component hierarchy with a container-level dashboard and focused child components.
- I practiced separating UI rendering concerns from data and state concerns.
- I learned to make components more reusable by keeping props and responsibilities focused.

## Summary
Today helped me move from basic React usage to advanced, production-style React architecture with hooks, reducers, context, reusable custom hooks, and performance-focused design.