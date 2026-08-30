import { accountPayload, getSession, handleError, json, requireDatabase } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    const session = await getSession(context.request, db);
    if (!session) return json({ authenticated: false });
    return json(await accountPayload(db, session.user));
  } catch (error) {
    return handleError(error);
  }
}
