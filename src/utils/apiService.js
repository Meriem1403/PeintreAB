// Service API pour communiquer avec le backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Fonction utilitaire pour les requêtes
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
    console.log(`📡 Requête API: ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Réponse API reçue:`, data?.length || 'non-array');
    return data;
  } catch (error) {
    console.error(`❌ Erreur API pour ${endpoint}:`, error.message);
    throw error;
  }
};

// API d'authentification
export const authAPI = {
  login: async (username, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },
};

// API des œuvres
export const worksAPI = {
  getAll: async (type = null) => {
    const query = type ? `?type=${type}` : '';
    return request(`/works${query}`);
  },
  
  getById: async (id) => {
    return request(`/works/${id}`);
  },
  
  create: async (work) => {
    return request('/works', {
      method: 'POST',
      body: work,
    });
  },
  
  update: async (id, updates) => {
    return request(`/works/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },
  
  delete: async (id) => {
    return request(`/works/${id}`, {
      method: 'DELETE',
    });
  },
};

// API des contacts
export const contactsAPI = {
  create: async (contact) => {
    return request('/contacts', {
      method: 'POST',
      body: contact,
    });
  },
  
  getAll: async () => {
    return request('/contacts');
  },
  
  markAsRead: async (id) => {
    return request(`/contacts/${id}/read`, {
      method: 'PUT',
    });
  },
  
  reply: async (id, replyData) => {
    return request(`/contacts/${id}/reply`, {
      method: 'POST',
      body: replyData,
    });
  },
  
  delete: async (id) => {
    return request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  },
};

// API des informations artiste
export const artistAPI = {
  get: async () => {
    return request('/artist');
  },
  
  update: async (data) => {
    return request('/artist', {
      method: 'PUT',
      body: data,
    });
  },
};

// API des informations de contact
export const contactInfoAPI = {
  get: async () => {
    return request('/contact-info');
  },
  
  update: async (data) => {
    return request('/contact-info', {
      method: 'PUT',
      body: data,
    });
  },
};

// API des paramètres du site
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

export const siteSettingsAPI = {
  get: async () => {
    return request('/site-settings');
  },

  update: async (data) => {
    return request('/site-settings', {
      method: 'PUT',
      body: data,
    });
  },

  getWebsiteQr: async (url) => {
    const q = url?.trim() ? `?url=${encodeURIComponent(url.trim())}` : '';
    return request(`/site-settings/website-qr${q}`);
  },
};
