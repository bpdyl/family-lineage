import { initializeSchema } from './schema.js';
import { closeDb } from '../config/db.js';
import { cleanupDuplicatePlaceholders } from '../services/import.service.js';

function run() {
  const db = initializeSchema();
  const result = cleanupDuplicatePlaceholders(db);

  console.log('Placeholder cleanup completed.');
  console.log(JSON.stringify(result, null, 2));

  closeDb();
}

try {
  run();
} catch (err) {
  console.error('Placeholder cleanup failed:', err);
  closeDb();
  process.exit(1);
}
