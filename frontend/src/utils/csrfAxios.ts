import axios from 'axios';
import { decrypt } from './encryption';

// Create a basic axios instance without interceptors
export const csrfAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Add basic interceptor for API key
csrfAxios.interceptors.request.use(
  async (config) => {
    const crypto = window.crypto;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (apiKey) {
      const apiKeyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey)).then((hash) => {
        return Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      });

      config.headers['x-api-key'] = apiKeyHash;
    }

    return config;
  },
  (error) => {
    console.error('CSRF Request error:', error);
    return Promise.reject(error);
  }
);

csrfAxios.interceptors.response.use(
  async (response) => {
    if (response.data?.encryptedData) {
      try {
        response.data = await decrypt(response.data.encryptedData);
      } catch (error) {
        console.error('Response decryption failed:', error);
        throw error;
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
