import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { encrypt, decrypt } from './encryption';
import { getCsrfToken } from './csrf';

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dit doet hij allemala met een fetch
axiosServices.interceptors.request.use(
  async (config) => {
    // Staat in .env.production als een toggle, niet vergeten in server ook aan te passen
    // Nog niet 100% getest, be carefull!
    if (import.meta.env.VITE_ENABLE_CSRF === 'true') {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      } else if (!config.url?.includes('/auth/')) {
        const newToken = await getCsrfToken();
        if (newToken) {
          config.headers['x-csrf-token'] = newToken;
        }
      }
    }

    // Zelfde geldt for dit, nog niet 100% getest, be carefull!
    const crypto = window.crypto;
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiKeyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey)).then((hash) => {
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    });

    if (config.data && import.meta.env.VITE_ENABLE_ENCRYPTION === 'true' && !config.url?.includes('/uploadthing/')) {
      try {
        config.data = {
          encryptedData: await encrypt(config.data)
        };
      } catch (error) {
        throw error;
      }
    }

    if (apiKey) {
      config.headers['x-api-key'] = apiKeyHash;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dit doet hij bij een response
axiosServices.interceptors.response.use(
  async (response) => {
    if (
      response.data?.encryptedData &&
      import.meta.env.VITE_ENABLE_ENCRYPTION === 'true' &&
      !response.config.url?.includes('/uploadthing/')
    ) {
      try {
        response.data = await decrypt(response.data.encryptedData);
      } catch (error) {
        throw error;
      }
    }
    return response;
  },
  (error) => {
    const authStore = useAuthStore();
    if (error.response?.status === 401 || error.response?.status === 403) {
      authStore.logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default axiosServices;
