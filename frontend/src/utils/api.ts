const refreshAccessToken = async (): Promise<string | null> => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
      // refresh тоже протух — разлогиниваем
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
};

const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('access_token');

  const makeRequest = (t: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  const res = await makeRequest(token);

  // Если 401 — пробуем обновить токен и повторить запрос
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) return makeRequest(newToken);
  }

  return res;
};

export default authFetch;