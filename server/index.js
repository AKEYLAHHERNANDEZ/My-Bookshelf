import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const production = process.argv.includes('--production');
const db = new DatabaseSync(join(root, 'bookshelf.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS library_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const getState = db.prepare('SELECT data FROM library_state WHERE id = 1');
const saveState = db.prepare(`INSERT INTO library_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`);
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const distRoot = resolve(root, 'dist');

async function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 32 * 1024 * 1024) throw new Error('Request too large');
  }
  return JSON.parse(body || '{}');
}

function normalizeLibrary(data) {
  if (!data || !Array.isArray(data.books)) return null;
  for (const book of data.books) {
    if (book.display_mode != null && !['spine', 'cover'].includes(book.display_mode)) return null;
    if (book.spine_url != null && (typeof book.spine_url !== 'string' || book.spine_url.length > 200 * 1024)) return null;
    book.spine_url ??= null;
    book.display_mode ??= 'spine';
  }
  return data;
}

const existingState = getState.get();
if (existingState) {
  try {
    const library = normalizeLibrary(JSON.parse(existingState.data));
    if (library) saveState.run(JSON.stringify(library));
  } catch {
    // Leave malformed legacy data untouched so it can be inspected or restored.
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/library' && req.method === 'GET') {
    const row = getState.get();
    return sendJson(res, 200, row ? normalizeLibrary(JSON.parse(row.data)) : null);
  }
  if (url.pathname === '/api/library' && req.method === 'PUT') {
    try {
      const data = await readBody(req);
      if (!normalizeLibrary(data)) return sendJson(res, 400, { error: 'Invalid library data or book spine fields' });
      saveState.run(JSON.stringify(data));
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON request' });
    }
  }

  // Vite is started by this process in development; serve the built app in production.
  if (production && req.method === 'GET') {
    const requested = resolve(root, 'dist', `.${decodeURIComponent(url.pathname)}`);
    const file = (requested === distRoot || requested.startsWith(`${distRoot}${sep}`)) && existsSync(requested)
      ? requested
      : join(root, 'dist', 'index.html');
    try {
      const contents = await readFile(file);
      res.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream' });
      return res.end(contents);
    } catch {
      res.writeHead(404);
      return res.end('Run npm run build first.');
    }
  }
  res.writeHead(404);
  res.end('Not found');
});

const port = Number(process.env.PORT || 3001);
server.listen(port, '127.0.0.1', () => console.log(`SQLite API listening on http://localhost:${port}`));

if (!production) {
  const vite = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1'], { cwd: root, stdio: 'inherit' });
  const stop = () => { vite.kill(); db.close(); server.close(() => process.exit()); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
