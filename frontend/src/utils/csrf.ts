import { csrfAxios } from './csrfAxios';

export async function getCsrfToken() {
  if (import.meta.env.VITE_ENABLE_CSRF === 'false') {
    return;
  }
  try {
    const response = await csrfAxios.get('/csrf/token');

    if (!response.data?.token) {
      console.warn('No CSRF token received from server');
      return null;
    }

    const token = response.data.token;

    // Set the token in a meta tag
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', token);

    return token;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
    // Don't show error to user, just fail silently
    return null;
  }
}
