import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, params) {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url, data) {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url, data) {
    // Check if data is FormData (for file uploads)
    if (data instanceof FormData) {
      const response = await this.client.put(url, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await this.client.put(url, data);
      return response.data;
    }
  }

  async delete(url) {
    const response = await this.client.delete(url);
    return response.data;
  }

  async upload(url, formData) {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (name, email, password, role) =>
    apiClient.post('/auth/register', { name, email, password, role }),
  getMe: () => apiClient.get('/auth/me'),
  updateMe: (profileData) => apiClient.put('/auth/me', profileData),
};

export const menuApi = {
  getMenuItems: (params) => apiClient.get('/menu', params),
  getMenuItemById: (id) => apiClient.get(`/menu/${id}`),
  getCategories: () => apiClient.get('/menu/categories'),
  createMenuItem: (formData) => apiClient.upload('/menu', formData),
  updateMenuItem: (id, formData) => apiClient.put(`/menu/${id}`, formData),
  deleteMenuItem: (id) => apiClient.delete(`/menu/${id}`),
};

export const orderApi = {
  createOrder: (orderData) => apiClient.post('/orders', orderData),
  getOrders: (params) => apiClient.get('/orders', params),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  updateOrderStatus: (id, status, assignedTo) =>
    apiClient.put(`/orders/${id}/status`, { status, assignedTo }),
  getDashboardStats: () => apiClient.get('/orders/dashboard'),
};

export const userApi = {
  getUsers: (params) => apiClient.get('/users', params),
  createStaff: (staffData) => apiClient.post('/users/staff', staffData),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

export const inventoryApi = {
  getInventory: (params) => apiClient.get('/inventory', params),
  createInventoryItem: (itemData) => apiClient.post('/inventory', itemData),
  updateInventoryItem: (id, itemData) => apiClient.put(`/inventory/${id}`, itemData),
  deleteInventoryItem: (id) => apiClient.delete(`/inventory/${id}`),
  getLowStockAlerts: () => apiClient.get('/inventory/alerts'),
};

export const promotionApi = {
  getPromotions: (params) => apiClient.get('/promotions', params),
  getActivePromotions: () => apiClient.get('/promotions/active'),
  createPromotion: (promoData) => apiClient.post('/promotions', promoData),
  updatePromotion: (id, promoData) => apiClient.put(`/promotions/${id}`, promoData),
  deletePromotion: (id) => apiClient.delete(`/promotions/${id}`),
  validatePromoCode: (promoCode, orderAmount) =>
    apiClient.post('/promotions/validate', { promoCode, orderAmount }),
};

export const feedbackApi = {
  createFeedback: (feedbackData) => apiClient.post('/feedback', feedbackData),
  getFeedback: (params) => apiClient.get('/feedback', params),
  getCustomerFeedback: () => apiClient.get('/feedback/my-feedback'),
  respondToFeedback: (id, adminResponse) =>
    apiClient.put(`/feedback/${id}/respond`, { adminResponse }),
  getFeedbackStats: () => apiClient.get('/feedback/stats'),
};
