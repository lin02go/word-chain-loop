import { onRequestPost as login } from './functions/api/auth/login.js';
import { onRequestPost as logout } from './functions/api/auth/logout.js';
import { onRequestGet as currentUser } from './functions/api/auth/me.js';
import { onRequestPost as register } from './functions/api/auth/register.js';
import { onRequestPost as resetPassword } from './functions/api/auth/reset-password.js';
import { onRequestPatch as updateUser } from './functions/api/user.js';
import { onRequestGet as getProgress, onRequestPut as putProgress } from './functions/api/user/progress.js';
import { onRequestPost as submitWordFeedback } from './functions/api/word-feedback.js';
import { onRequestGet as getCustomLevels, onRequestPost as submitCustomLevel } from './functions/api/custom-levels.js';
import { onRequestGet as getCommunityLevels } from './functions/api/community-levels.js';
import { onRequestGet as getAdminCustomLevels, onRequestPatch as reviewCustomLevel } from './functions/api/admin/custom-levels.js';

const apiRoutes = new Map([
  ['POST /api/auth/login', login],
  ['POST /api/auth/logout', logout],
  ['GET /api/auth/me', currentUser],
  ['POST /api/auth/register', register],
  ['POST /api/auth/reset-password', resetPassword],
  ['PATCH /api/user', updateUser],
  ['GET /api/user/progress', getProgress],
  ['PUT /api/user/progress', putProgress],
  ['POST /api/word-feedback', submitWordFeedback],
  ['GET /api/custom-levels', getCustomLevels],
  ['POST /api/custom-levels', submitCustomLevel],
  ['GET /api/community-levels', getCommunityLevels],
  ['GET /api/admin/custom-levels', getAdminCustomLevels],
  ['PATCH /api/admin/custom-levels', reviewCustomLevel],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = apiRoutes.get(`${request.method} ${url.pathname}`);
    if (route) return route({ request, env });
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'API route not found.', code: 'NOT_FOUND' }), {
        status: 404,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
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
};
