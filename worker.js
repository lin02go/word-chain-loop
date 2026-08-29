const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function authenticatedUser(request) {
  const userId = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  if (!userId || !email) return null;
  let fullName = null;
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  if (encodedName && request.headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
    try { fullName = decodeURIComponent(encodedName); } catch { fullName = null; }
  }
  return { userId, email, fullName };
}

function fallbackDisplayName(user) {
  return user.fullName || user.email.split('@')[0] || 'Word Loop Player';
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      platform_name TEXT,
      nickname TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS player_progress (
      user_id TEXT PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`)
  ]);
}

async function upsertProfile(db, user) {
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO user_profiles (user_id, email, platform_name, nickname, created_at, updated_at)
    VALUES (?, ?, ?, NULL, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email,
      platform_name = excluded.platform_name,
      updated_at = excluded.updated_at`)
    .bind(user.userId, user.email, user.fullName, now, now).run();
  return db.prepare(`SELECT nickname, created_at AS createdAt, updated_at AS updatedAt
    FROM user_profiles WHERE user_id = ?`).bind(user.userId).first();
}

async function readBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 110000) throw new Response('Payload too large', { status: 413 });
  try { return await request.json(); } catch { throw new Response('Invalid JSON', { status: 400 }); }
}

function verifySameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function handleUser(request, env, user) {
  if (!user) return json({ authenticated: false, signInPath: '/signin-with-chatgpt?return_to=%2Fword-chain-game.html' });
  if (!env.DB) {
    if (request.method !== 'GET') return json({ error: 'Account storage is unavailable.' }, 503);
    return json({
      authenticated: true,
      email: user.email,
      profile: { nickname: null, displayName: fallbackDisplayName(user) },
      hasCloudProgress: false,
      progressUpdatedAt: null,
      persistenceAvailable: false
    });
  }

  await ensureSchema(env.DB);
  const profile = await upsertProfile(env.DB, user);
  if (request.method === 'GET') {
    const progress = await env.DB.prepare('SELECT updated_at AS updatedAt FROM player_progress WHERE user_id = ?').bind(user.userId).first();
    return json({
      authenticated: true,
      email: user.email,
      profile: {
        nickname: profile?.nickname || null,
        displayName: profile?.nickname || fallbackDisplayName(user),
        createdAt: profile?.createdAt || null
      },
      hasCloudProgress: Boolean(progress),
      progressUpdatedAt: progress?.updatedAt || null,
      persistenceAvailable: true
    });
  }

  if (request.method === 'PATCH') {
    if (!verifySameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
    const body = await readBody(request);
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const length = Array.from(nickname).length;
    if (length < 2 || length > 24 || /[<>\u0000-\u001f\u007f]/.test(nickname)) {
      return json({ error: 'Nickname must contain 2–24 safe characters.' }, 400);
    }
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE user_profiles SET nickname = ?, updated_at = ? WHERE user_id = ?')
      .bind(nickname, now, user.userId).run();
    return json({ profile: { nickname, displayName: nickname, createdAt: profile?.createdAt || null } });
  }

  return json({ error: 'Method not allowed.' }, 405);
}

async function handleProgress(request, env, user) {
  if (!user) return json({ error: 'Sign in required.' }, 401);
  if (!env.DB) return json({ error: 'Account storage is unavailable.' }, 503);
  await ensureSchema(env.DB);

  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT snapshot_json AS snapshotJson, updated_at AS updatedAt FROM player_progress WHERE user_id = ?')
      .bind(user.userId).first();
    if (!row) return json({ error: 'No cloud progress exists.' }, 404);
    let snapshot;
    try { snapshot = JSON.parse(row.snapshotJson); } catch { return json({ error: 'Cloud progress is invalid.' }, 500); }
    return json({ snapshot, updatedAt: row.updatedAt });
  }

  if (request.method === 'PUT') {
    if (!verifySameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
    const body = await readBody(request);
    const snapshot = body && body.snapshot;
    if (!snapshot || snapshot.version !== 1 || !snapshot.values || typeof snapshot.values !== 'object' || Array.isArray(snapshot.values)) {
      return json({ error: 'Invalid progress snapshot.' }, 400);
    }
    const keys = Object.keys(snapshot.values);
    if (keys.length > 160 || keys.some((key) => !key.startsWith('word-chain-loop:') || typeof snapshot.values[key] !== 'string')) {
      return json({ error: 'Invalid progress entries.' }, 400);
    }
    const serialized = JSON.stringify(snapshot);
    if (serialized.length > 100000) return json({ error: 'Progress snapshot is too large.' }, 413);
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO player_progress (user_id, snapshot_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at`)
      .bind(user.userId, serialized, now).run();
    return json({ updatedAt: now });
  }

  return json({ error: 'Method not allowed.' }, 405);
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const user = authenticatedUser(request);

  if (url.pathname === '/api/user') return handleUser(request, env, user);
  if (url.pathname === '/api/user/progress') return handleProgress(request, env, user);

  if (env?.ASSETS && typeof env.ASSETS.fetch === 'function') {
    if (url.pathname === '/') {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
  return new Response('Word Loop assets are unavailable.', {
    status: 500,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}

export default {
  async fetch(request, env) {
    try { return await handleRequest(request, env); }
    catch (error) {
      if (error instanceof Response) return error;
      console.error('Word Loop worker error', error);
      return json({ error: 'Unexpected server error.' }, 500);
    }
  }
};
