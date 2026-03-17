import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/pain-points.db');

let db = null;

/**
 * 初始化数据库
 */
export function initDatabase() {
  const dataDir = join(__dirname, '../../data');
  
  try {
    // 确保数据目录存在
    import('fs').then(fs => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    });
    
    db = new Database(DB_PATH);
    
    // 创建表
    db.exec(`
      CREATE TABLE IF NOT EXISTS pain_points (
        id TEXT PRIMARY KEY,
        conclusion TEXT NOT NULL,
        evidence_url TEXT,
        source TEXT,
        next_action TEXT,
        status TEXT DEFAULT 'discovered',
        created_at TEXT,
        validated_at TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_source ON pain_points(source);
      CREATE INDEX IF NOT EXISTS idx_status ON pain_points(status);
      CREATE INDEX IF NOT EXISTS idx_created_at ON pain_points(created_at);
    `);
    
    console.log('✅ 数据库初始化成功:', DB_PATH);
    return db;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

/**
 * 保存痛点
 */
export function savePainPoint(painPoint) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO pain_points 
    (id, conclusion, evidence_url, source, next_action, status, created_at, validated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    painPoint.id,
    painPoint.conclusion,
    painPoint.evidence_url,
    painPoint.source,
    painPoint.next_action,
    painPoint.status,
    painPoint.created_at,
    painPoint.validated_at || null
  );
}

/**
 * 获取所有痛点
 */
export function getAllPainPoints(limit = 100) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM pain_points 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(limit);
}

/**
 * 按状态获取痛点
 */
export function getPainPointsByStatus(status, limit = 50) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM pain_points 
    WHERE status = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(status, limit);
}

/**
 * 统计痛点
 */
export function getPainPointStats() {
  const db = getDatabase();
  const total = db.prepare('SELECT COUNT(*) as count FROM pain_points').get();
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM pain_points 
    GROUP BY status
  `).all();
  const bySource = db.prepare(`
    SELECT source, COUNT(*) as count 
    FROM pain_points 
    GROUP BY source
  `).all();
  
  return { total: total.count, byStatus, bySource };
}

/**
 * 更新痛点状态
 */
export function updatePainPointStatus(id, status) {
  const db = getDatabase();
  const validatedAt = status === 'validated' ? new Date().toISOString().split('T')[0] : null;
  
  return db.prepare(`
    UPDATE pain_points 
    SET status = ?, validated_at = ?
    WHERE id = ?
  `).run(status, validatedAt, id);
}

/**
 * 关闭数据库
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
