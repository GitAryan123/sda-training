'use strict';

class ApiService {
  constructor() {
    // Base URL configuration matching the environment
    this.baseURL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) 
      || 'http://localhost:3000/api/v1';
    
    // Safely initialize localStorage reference
    this.storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : {
      getItem: (key) => this._mockStorage?.[key] || null,
      setItem: (key, val) => {
        if (!this._mockStorage) this._mockStorage = {};
        this._mockStorage[key] = val;
      },
      removeItem: (key) => {
        if (this._mockStorage) delete this._mockStorage[key];
      }
    };
    
    this.token = this.storage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.data && response.data.accessToken) {
      this.token = response.data.accessToken;
      this.storage.setItem('authToken', this.token);
    }

    return response;
  }

  async logout() {
    this.token = null;
    this.storage.removeItem('authToken');
  }

  // User methods
  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/users?${queryParams}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Product methods
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/products?${queryParams}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  // Order methods
  async getOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/orders?${queryParams}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // Analytics methods
  async getAnalytics(timeRange = '30d') {
    return this.request(`/analytics?timeRange=${timeRange}`);
  }
}

// Export single instance or class based on context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = new ApiService();
} else {
  window.ApiService = new ApiService();
}
