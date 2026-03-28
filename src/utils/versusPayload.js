/**
 * Maps API versus payload to player rows for the vote UI.
 * Supports:
 * - Legacy `{ players: [{ id, name, url, alt? }, …] }`
 * - Current API `{ id, name1, name2, image1, image2 }` where images are
 *   base64 strings (no data: prefix) or numeric byte arrays (JSON).
 *
 * @returns {{ players: Array<{ id: number, name: string, url: string, alt: string }>, objectUrls: string[] }}
 * Callers must `URL.revokeObjectURL` for each entry in `objectUrls` when done.
 */
export function normalizeVersusToPlayers(data) {
  if (!data || typeof data !== 'object') {
    return { players: [], objectUrls: [] };
  }

  if (Array.isArray(data.players) && data.players.length >= 2) {
    return {
      players: data.players.map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        alt: p.alt || p.name,
      })),
      objectUrls: [],
    };
  }

  const name1 = data.name1;
  const name2 = data.name2;
  if (name1 == null || name2 == null) {
    return { players: [], objectUrls: [] };
  }

  const objectUrls = [];
  const url1 = imageValueToSrc(data.image1, objectUrls);
  const url2 = imageValueToSrc(data.image2, objectUrls);

  return {
    players: [
      {
        id: 1,
        name: String(name1),
        url: url1,
        alt: String(name1),
      },
      {
        id: 2,
        name: String(name2),
        url: url2,
        alt: String(name2),
      },
    ],
    objectUrls,
  };
}

/**
 * @param {unknown} value
 * @param {string[]} objectUrlsOut — blob: URLs to revoke later
 */
function imageValueToSrc(value, objectUrlsOut) {
  if (value == null || value === '') return '';

  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray(value.data) &&
    value.data.length > 0 &&
    typeof value.data[0] === 'number'
  ) {
    return imageValueToSrc(value.data, objectUrlsOut);
  }

  if (typeof value === 'string') {
    const s = value.trim();
    if (
      s.startsWith('data:') ||
      s.startsWith('blob:') ||
      /^https?:\/\//i.test(s)
    ) {
      return s;
    }
    const mime = base64LooksLikeJpeg(s) ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${s}`;
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
    const u8 = new Uint8Array(value);
    const mime = sniffImageMime(u8);
    const blob = new Blob([u8], { type: mime });
    const url = URL.createObjectURL(blob);
    objectUrlsOut.push(url);
    return url;
  }

  return '';
}

function base64LooksLikeJpeg(b64) {
  return b64.startsWith('/9j/');
}

function sniffImageMime(u8) {
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xd8) return 'image/jpeg';
  if (
    u8.length >= 8 &&
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47
  ) {
    return 'image/png';
  }
  if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
    return 'image/jpeg';
  }
  return 'image/png';
}
