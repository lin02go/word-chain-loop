import {
  ensureSchema, handleError, HttpError, json, readJson, requireDatabase,
  requireSession, verifyOrigin,
} from '../../_lib/auth.js';

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    await ensureSchema(db);
    const session = await requireSession(context.request, db);
    const row = await db.prepare('SELECT snapshot_json AS snapshotJson, updated_at AS updatedAt FROM player_progress WHERE user_id = ?')
      .bind(session.user.id).first();
    if (!row) throw new HttpError(404, 'NO_PROGRESS', 'No cloud progress exists.');
    let snapshot;
    try { snapshot = JSON.parse(row.snapshotJson); }
    catch { throw new HttpError(500, 'INVALID_PROGRESS', 'Cloud progress is invalid.'); }
    return json({ snapshot, updatedAt: row.updatedAt });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPut(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    await ensureSchema(db);
    const session = await requireSession(context.request, db);
    const body = await readJson(context.request);
    const snapshot = body && body.snapshot;
    if (!snapshot || snapshot.version !== 1 || !snapshot.values || typeof snapshot.values !== 'object' || Array.isArray(snapshot.values)) {
      throw new HttpError(400, 'VALIDATION', 'Invalid progress snapshot.');
    }
    const keys = Object.keys(snapshot.values);
    if (keys.length > 160 || keys.some((key) => !key.startsWith('word-chain-loop:') || typeof snapshot.values[key] !== 'string')) {
      throw new HttpError(400, 'VALIDATION', 'Invalid progress entries.');
    }
    const serialized = JSON.stringify(snapshot);
    if (serialized.length > 100000) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Progress snapshot is too large.');
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO player_progress (user_id, snapshot_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at`)
      .bind(session.user.id, serialized, now).run();
    return json({ updatedAt: now });
  } catch (error) {
    return handleError(error);
  }
}
