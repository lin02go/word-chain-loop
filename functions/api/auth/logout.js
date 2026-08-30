import { clearSessionCookie, getSession, handleError, json, requireDatabase, verifyOrigin } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const session = await getSession(context.request, db);
    if (session) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
    return json({ authenticated: false }, 200, { 'set-cookie': clearSessionCookie() });
  } catch (error) {
    return handleError(error);
  }
}
