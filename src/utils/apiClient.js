import { supabase } from '../firebase';

export const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[getAuthToken] Error getting auth token:', error);
    return null;
  }
};

export const authenticatedFetch = async (url, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const timeout = options.timeout || 600000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const { signal: _, timeout: __, ...fetchOptions } = options;
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
        try {
          const { signal: _, timeout: __, ...retryOptions } = options;
          const retryResponse = await fetch(url, {
            ...retryOptions,
            headers,
            credentials: 'include',
            signal: retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          return retryResponse;
        } catch (retryError) {
          clearTimeout(retryTimeoutId);
          throw retryError;
        }
      }
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The operation may still be processing.');
    }
    throw error;
  }
};

export const authenticatedPost = async (url, data, options = {}) => {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

export const authenticatedPostFormData = async (url, formData, options = {}) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated. Please sign in to upload files.');

  const headers = { ...options.headers };
  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include',
    ...options,
  });

  if (response.status === 401) {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return fetch(url, { method: 'POST', body: formData, headers, credentials: 'include', ...options });
    }
    throw new Error('Authentication failed. Please sign in again.');
  }

  return response;
};

export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { message: errorText || `API error: ${response.status}` };
    }
    throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
  }
  return response.json();
};
