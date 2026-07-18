import ApiService from '../services/ApiService';

// Singleton instance of the API Service layer
// Base URL is empty so fetches fail gracefully and the hook serves mock telemetry data
const apiInstance = new ApiService('');

export function useApiService() {
  return apiInstance;
}
