const BASE_URL = '/api/v1';

export async function apiRequest(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('audira_token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers
  };

  const config = {
    method,
    headers: defaultHeaders
  };

  if (body) {
    if (body instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser set boundary
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'API request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body, headers) => apiRequest(url, { method: 'POST', body, headers }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body }),
  patch: (url, body) => apiRequest(url, { method: 'PATCH', body }),
  delete: (url) => apiRequest(url, { method: 'DELETE' })
};
