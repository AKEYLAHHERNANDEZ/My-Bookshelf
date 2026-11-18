import { DatabaseSync } from 'node:sqlite';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const db = new DatabaseSync(join(root, 'bookshelf.sqlite'), { readOnly: true });
try {
  const row = db.prepare('SELECT data FROM library_state WHERE id = 1').get();
  if (!row) throw new Error('No saved library was found in bookshelf.sqlite. Start the local app once, then run this command again.');
  const sqlString = JSON.stringify(JSON.parse(row.data)).replaceAll("'", "''");
  await writeFile(join(root, 'd1-import.sql'), `INSERT INTO library_state (id, data, updated_at) VALUES (1, '${sqlString}', CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;\n`, 'utf8');
  console.log('Created d1-import.sql. Keep it private and delete it after importing into D1.');
} finally {
  db.close();
}
