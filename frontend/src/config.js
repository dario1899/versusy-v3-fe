/**
 * App settings. Values come from `.env` (REACT_APP_*), read when `npm start` / `npm run build` runs.
 */

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** How long vote results stay on screen before moving to the next versus. */
export const RESULTS_DISPLAY_MS =
  positiveNumber(process.env.REACT_APP_RESULTS_DISPLAY_SECONDS, 5) * 1000;
