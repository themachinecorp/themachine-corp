import { getDatabase } from '../src/storage/database.js';

const db = getDatabase();
const stats = db.prepare(`
  SELECT source, status, COUNT(*) as count 
  FROM pain_points 
  GROUP BY source, status
  ORDER BY source, status
`).all();

console.log('Source | Status | Count');
console.log('-------|--------|------');
stats.forEach(s => console.log(`${s.source} | ${s.status} | ${s.count}`));

const total = db.prepare('SELECT COUNT(*) as count FROM pain_points').get();
console.log('\nTotal:', total.count);
