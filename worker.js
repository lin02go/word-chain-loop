import { onRequestPost as login } from './functions/api/auth/login.js';
import { onRequestPost as logout } from './functions/api/auth/logout.js';
import { onRequestGet as currentUser } from './functions/api/auth/me.js';
import { onRequestPost as register } from './functions/api/auth/register.js';
import { onRequestPatch as updateUser } from './functions/api/user.js';
import { onRequestGet as getProgress, onRequestPut as putProgress } from './functions/api/user/progress.js';

const apiRoutes = new Map([
  ['POST /api/auth/login', login],
  ['POST /api/auth/logout', logout],
  ['GET /api/auth/me', currentUser],
  ['POST /api/auth/register', register],
  ['PATCH /api/user', updateUser],
  ['GET /api/user/progress', getProgress],
  ['PUT /api/user/progress', putProgress],
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
