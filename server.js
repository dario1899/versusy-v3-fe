const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/** 1×1 PNG — same shape as backend (raw base64, no data: prefix) */
const MOCK_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const versuses = [
  {
    id: 1,
    name1: 'Messi',
    name2: 'Ronaldo',
    image1: MOCK_PNG,
    image2: MOCK_PNG,
    resultTexts: {
      1: '18% (23 głosów)',
      2: '82% (2345 głosów)',
    },
  },
  {
    id: 2,
    name1: 'Góry',
    name2: 'Morze',
    image1: MOCK_PNG,
    image2: MOCK_PNG,
    resultTexts: {
      1: '45% (1200 głosów)',
      2: '55% (1340 głosów)',
    },
  },
  {
    id: 3,
    name1: 'Opcja A',
    name2: 'Opcja B',
    image1: MOCK_PNG,
    image2: MOCK_PNG,
    resultTexts: {
      1: '50% (100 głosów)',
      2: '50% (100 głosów)',
    },
  },
];

function extractToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password, login } = req.body || {};
  const identifier = email || login;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }
  const accessToken = Buffer.from(`access:${identifier}:${Date.now()}`).toString(
    'base64'
  );
  const refreshToken = Buffer.from(
    `refresh:${identifier}:${Date.now()}`
  ).toString('base64');
  res.json({
    accessToken,
    refreshToken,
    isRequiredActivation: false,
    user: { email: String(identifier), login: String(identifier) },
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ ok: true });
});

function versusById(idParam) {
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) return null;
  return versuses.find((v) => v.id === id) ?? null;
}

app.get('/api/versus/count', requireAuth, (req, res) => {
  res.json({ count: versuses.length });
});

app.get('/api/versus/:id', requireAuth, (req, res) => {
  const row = versusById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Versus not found' });
  }
  const { resultTexts: _t, ...body } = row;
  res.json(body);
});

app.post('/api/versus/:id/vote', requireAuth, (req, res) => {
  const row = versusById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Versus not found' });
  }
  const choice = req.body?.choice;
  if (choice !== 1 && choice !== 2) {
    return res.status(400).json({ error: 'choice must be 1 or 2' });
  }
  const { resultTexts } = row;
  res.json({ texts: resultTexts });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
