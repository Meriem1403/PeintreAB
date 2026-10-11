// Service API pour communiquer avec le backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

let onUnauthorized = null;

/** Enregistré par AuthProvider pour déconnecter sur 401. */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = typeof handler === 'function' ? handler : null;
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const isFormData = options.body instanceof FormData;
  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (!isFormData) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const url = `${API_URL}${endpoint}`;
    if (import.meta.env.DEV) {
      console.log(`📡 Requête API: ${url}`);
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      onUnauthorized?.();
      const errorData = await response.json().catch(() => ({ error: 'Session expirée' }));
      throw new Error(errorData.error || 'Session expirée');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log(`✅ Réponse API reçue:`, data?.length || 'non-array');
    }
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`❌ Erreur API pour ${endpoint}:`, error.message);
    }
    throw error;
  }
};

export const authAPI = {
  login: async (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  forgotPassword: async (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: async (token, password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),
};

export const worksAPI = {
  getAll: async (type = null) => {
    const query = type ? `?type=${type}` : '';
    return request(`/works${query}`);
  },

  getById: async (id) => request(`/works/${id}`),

  create: async (work) =>
    request('/works', {
      method: 'POST',
      body: work,
    }),

  update: async (id, updates) =>
    request(`/works/${id}`, {
      method: 'PUT',
      body: updates,
    }),

  delete: async (id) =>
    request(`/works/${id}`, {
      method: 'DELETE',
    }),
};

export const contactsAPI = {
  create: async (contact) =>
    request('/contacts', {
      method: 'POST',
      body: contact,
    }),

  getAll: async () => request('/contacts'),

  getSummary: async () => request('/contacts/summary'),

  markAsRead: async (id) =>
    request(`/contacts/${id}/read`, {
      method: 'PUT',
    }),

  reply: async (id, replyData) =>
    request(`/contacts/${id}/reply`, {
      method: 'POST',
      body: replyData,
    }),

  delete: async (id) =>
    request(`/contacts/${id}`, {
      method: 'DELETE',
    }),
};

export const artistAPI = {
  get: async () => request('/artist'),

  update: async (data) =>
    request('/artist', {
      method: 'PUT',
      body: data,
    }),
};

export const contactInfoAPI = {
  get: async () => request('/contact-info'),

  update: async (data) =>
    request('/contact-info', {
      method: 'PUT',
      body: data,
    }),
};

export const uploadAPI = {
  uploadImage: async (file, folder = 'uploads') => {
    const formData = new FormData();
    formData.append('image', file);
    return request(`/upload/image?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const eventsAPI = {
  getTicketInfo: (workId) => request(`/events/${workId}/ticket-info`),
  register: (workId, body) =>
    request(`/events/${workId}/register`, { method: 'POST', body }),
  getTicket: (code) => request(`/events/tickets/${code}`),
  getLeadMeta: (eventId) => {
    const q = eventId ? `?event=${encodeURIComponent(eventId)}` : '';
    return request(`/events/leads/meta${q}`);
  },
  captureLead: (body) => request('/events/leads', { method: 'POST', body }),
  listVisitors: () => request('/events/admin/visitors'),
  listRegistrations: (workId) => request(`/events/admin/${workId}/registrations`),
  inviteOptedIn: (workId, body = {}) =>
    request(`/events/admin/${workId}/invite-opted-in`, { method: 'POST', body }),
  checkIn: (code, body = {}) =>
    request('/events/admin/tickets/check-in', {
      method: 'POST',
      body: { code, ...body },
    }),
};

export const galleryCategoriesAPI = {
  getAll: () => request('/gallery-categories'),
  create: (body) => request('/gallery-categories', { method: 'POST', body }),
  update: (id, body) => request(`/gallery-categories/${id}`, { method: 'PUT', body }),
  reorder: (order) =>
    request('/gallery-categories/reorder', { method: 'PUT', body: { order } }),
  delete: (id) => request(`/gallery-categories/${id}`, { method: 'DELETE' }),
};

export const siteSettingsAPI = {
  get: async () => request('/site-settings'),

  update: async (data) =>
    request('/site-settings', {
      method: 'PUT',
      body: data,
    }),

  getWebsiteQr: async (url) => {
    const q = url?.trim() ? `?url=${encodeURIComponent(url.trim())}` : '';
    return request(`/site-settings/website-qr${q}`);
  },
};

export const themePalettesAPI = {
  listPresets: () => request('/theme-palettes/presets'),
  createPreset: (body) => request('/theme-palettes/presets', { method: 'POST', body }),
  deletePreset: (id) => request(`/theme-palettes/presets/${id}`, { method: 'DELETE' }),
  listHistory: () => request('/theme-palettes/history'),
  deleteHistory: (id) => request(`/theme-palettes/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/theme-palettes/history', { method: 'DELETE' }),
};

export const analyticsAPI = {
  getStats: () => request('/analytics/stats'),
};

export const smtpAPI = {
  getStatus: () => request('/smtp/status'),
  update: (body) => request('/smtp', { method: 'PUT', body }),
  createSetupLink: () => request('/smtp/setup-link', { method: 'POST', body: {} }),
  validateSetupToken: (token) => request(`/smtp/setup/${encodeURIComponent(token)}`),
  completeSetup: (token, body) =>
    request(`/smtp/setup/${encodeURIComponent(token)}`, {
      method: 'POST',
      body,
    }),
};
