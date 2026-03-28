/** Polish plural: 1 głos, 2–4 głosy (except 12–14), 5+ głosów */
function glossWord(n) {
  const v = Math.floor(Math.abs(Number(n)) || 0);
  if (v === 1) return 'głos';
  const last = v % 10;
  const lastTwo = v % 100;
  if (lastTwo >= 12 && lastTwo <= 14) return 'głosów';
  if (last >= 2 && last <= 4) return 'głosy';
  return 'głosów';
}

/**
 * @param {number} votes — votes for this option
 * @param {number} totalVotes — pic1 + pic2
 * @returns {string} e.g. "10 głosów (50%)"
 */
export function formatVoteSummary(votes, totalVotes) {
  const v = Math.floor(Math.abs(Number(votes)) || 0);
  const t = Math.max(0, Math.floor(Number(totalVotes)) || 0);
  const pct = t > 0 ? Math.round((v / t) * 100) : 0;
  return `${v} ${glossWord(v)} (${pct}%)`;
}
