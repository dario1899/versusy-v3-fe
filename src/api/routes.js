/**
 * Central API URLs.
 * Set `REACT_APP_API_BASE` in `.env` (e.g. Cloud Run URL + optional `/api` prefix).
 * If unset, defaults to `/api` (same-origin; use only if something proxies `/api` for you).
 */
const raw =
  process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE_URL || '';
export const API_BASE = raw.replace(/\/$/, '') || '/api';

export const apiRoutes = {
  authLogin: () => `${API_BASE}/v1/auth/login`,
  authLogout: () => `${API_BASE}/v1/auth/logout`,
  versusesCount: () => `${API_BASE}/versus/count`,
  /** @param {number} versusId — 1-based id */
  versusByIndex: (versusId) => `${API_BASE}/versus/${versusId}`,
  /** @param {number} versusId — 1-based id */
  versusVote: (versusId) => `${API_BASE}/versus/${versusId}/vote`,
};
