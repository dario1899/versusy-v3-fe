/**
 * Auth + API calls — aligned with versusy-admin `src/api/client.js`
 * (tokens, login/logout, fetch + credentials + JSON headers).
 */
import { apiRoutes } from './routes';

const STORAGE_ACCESS = 'accessToken';
const STORAGE_REFRESH = 'refreshToken';

export function getStoredAccessToken() {
  return (
    localStorage.getItem(STORAGE_ACCESS) || localStorage.getItem('authToken')
  );
}

export function getStoredRefreshToken() {
  return localStorage.getItem(STORAGE_REFRESH);
}

function authHeadersExtra() {
  const token = getStoredAccessToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function getAuthHeaders() {
  return { 'Content-Type': 'application/json', ...authHeadersExtra() };
}

export function persistAuthTokens(data) {
  if (data?.accessToken) localStorage.setItem(STORAGE_ACCESS, data.accessToken);
  else localStorage.removeItem(STORAGE_ACCESS);
  if (data?.refreshToken) localStorage.setItem(STORAGE_REFRESH, data.refreshToken);
  else localStorage.removeItem(STORAGE_REFRESH);
}

export function clearAuthTokens() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem('authToken');
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  const res = await fetch(apiRoutes.authLogin(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Login failed');
  }
  const data = await res.json().catch(() => ({}));
  persistAuthTokens(data);
  return data;
}

export async function logout() {
  try {
    const refreshToken = getStoredRefreshToken();
    await fetch(apiRoutes.authLogout(), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearAuthTokens();
  }
}

export async function fetchVersusesCount() {
  const res = await fetch(apiRoutes.versusesCount(), {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load versuses count');
  const data = await res.json();

  return data.count;
}

function isVersusEntityNotFound(status, body) {
  if (status === 404) return true;
  const parts = [body?.message, body?.error, body?.detail]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return parts.some((p) => p.includes('entity not found'));
}

/** @param {number} versusId — 1-based versus id in the API */
export async function fetchVersusByIndex(versusId) {
  const res = await fetch(apiRoutes.versusByIndex(versusId), {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.message || data.error || data.detail || 'Failed to load versus';
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    err.entityNotFound = isVersusEntityNotFound(res.status, data);
    throw err;
  }
  return data;
}

/**
 * @param {number} versusId — 1-based versus id
 * @param {1 | 2} choice
 */
export async function postVersusVote(versusId, choice) {
  const res = await fetch(apiRoutes.versusVote(versusId), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ choice }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Vote failed');
  }
  return res.json();
}
