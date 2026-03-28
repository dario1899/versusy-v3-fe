/**
 * Central API URLs — same pattern as versusy-admin (`src/api/routes.js`).
 * Dev: defaults to `/api` (CRA proxy → backend). Production: set REACT_APP_API_BASE
 * to full origin including path prefix, e.g. https://example.com/api
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
