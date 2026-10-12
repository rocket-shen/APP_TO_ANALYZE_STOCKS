// filepath: my-app/src/services/api.js

/** Raised when the API returns 401; AuthGate listens via `auth:required`. */
export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * fetch wrapper: always sends cookies; on 401 notifies the login gate.
 */
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:required'));
    throw new AuthError('未登录或会话已过期');
  }
  return response;
}

export async function fetchAuthMe() {
  const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('无法获取登录状态');
  }
  return response.json();
}

export async function login(username, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || '登录失败');
  }
  return data;
}

export async function logout() {
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('退出登录失败');
  }
  return response.json();
}

export const fetchFinancialData = async (symbol) => {
  const response = await apiFetch(`/api/v1/financial_data/${symbol}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const fetchQuoteData = async (symbol) => {
  const response = await apiFetch(`/api/v1/quote_data/${symbol}`);
  if (!response.ok) {
    throw new Error('获取quote_data行情失败');
  }
  return response.json();
};

export const fetchFinancialPerformance = async (code) => {
  const response = await apiFetch(`/api/v1/financial_performance/${code}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const syncFinancialData = async (symbol) => {
  const response = await apiFetch(`/api/v1/sync_financial_data/${symbol}`, {
    method: 'POST',
  });
  const result = await response.json().catch(() => ({}));
  return { response, result };
};

export const downloadExcel = async (symbol) => {
  return apiFetch(`/api/v1/export-excel/${symbol}`, { method: 'GET' });
};
