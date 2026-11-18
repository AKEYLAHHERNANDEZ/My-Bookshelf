const encoder = new TextEncoder();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim());
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}

async function passwordMatches(password, expected) {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return equalBytes(new Uint8Array(providedHash), new Uint8Array(expectedHash));
}

async function createToken(env) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  return `${expiresAt}.${await hmac(env.SESSION_SECRET, String(expiresAt))}`;
}

async function isAuthorized(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const [expiry, signature, extra] = token.split('.');
  if (!expiry || !signature || extra || !/^\d+$/.test(expiry) || Number(expiry) < Date.now() / 1000) return false;
  const expected = await hmac(env.SESSION_SECRET, expiry);
  return equalBytes(encoder.encode(signature), encoder.encode(expected));
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!env.APP_PASSWORD || !env.SESSION_SECRET || !env.DB) {
      return json({ error: 'API is not configured.' }, 503, cors);
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        if (typeof password !== 'string' || !await passwordMatches(password, env.APP_PASSWORD || '')) {
          return json({ error: 'Incorrect password.' }, 401, cors);
        }
        return json({ token: await createToken(env) }, 200, cors);
      } catch {
        return json({ error: 'Invalid login request.' }, 400, cors);
      }
    }

    if (url.pathname !== '/api/library') return json({ error: 'Not found.' }, 404, cors);
    if (!await isAuthorized(request, env)) return json({ error: 'Please sign in again.' }, 401, cors);

    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT data FROM library_state WHERE id = 1').first();
      return json(row ? JSON.parse(row.data) : null, 200, cors);
    }
    if (request.method === 'PUT') {
      try {
        const data = await request.json();
        if (!data || !Array.isArray(data.books)) return json({ error: 'Invalid library data.' }, 400, cors);
        await env.DB.prepare(`INSERT INTO library_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`)
          .bind(JSON.stringify(data)).run();
        return json({ ok: true }, 200, cors);
      } catch {
        return json({ error: 'Invalid library data.' }, 400, cors);
      }
    }
    return json({ error: 'Method not allowed.' }, 405, { ...cors, Allow: 'GET, PUT, OPTIONS' });
  },
};
