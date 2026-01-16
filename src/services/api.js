const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token;
  }
  return null;
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email, password) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: async (email, password) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  resetPassword: async (email, newPassword) => {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  getCurrentUser: async () => {
    return fetchWithAuth('/auth/me');
  },
};

// Articles API
export const articlesAPI = {
  getAll: async () => {
    return fetchWithAuth('/articles');
  },

  getOne: async (id) => {
    return fetchWithAuth(`/articles/${id}`);
  },

  create: async (articleData) => {
    return fetchWithAuth('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  },

  update: async (id, articleData) => {
    return fetchWithAuth(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/articles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Rules API
export const rulesAPI = {
  getAll: async () => {
    return fetchWithAuth('/rules');
  },

  upsert: async (ruleData) => {
    return fetchWithAuth('/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  },

  batchUpdate: async (rules) => {
    return fetchWithAuth('/rules/batch', {
      method: 'POST',
      body: JSON.stringify({ rules }),
    });
  },
};
