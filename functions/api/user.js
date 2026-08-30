import {
  handleError, json, readJson, requireDatabase, requireSession,
  validateNickname, verifyOrigin,
} from '../_lib/auth.js';

export async function onRequestPatch(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const session = await requireSession(context.request, db);
    const body = await readJson(context.request);
    const nickname = validateNickname(body.nickname);
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?')
      .bind(nickname, now, session.user.id).run();
    return json({ profile: { nickname, displayName: nickname } });
  } catch (error) {
    return handleError(error);
  }
}
