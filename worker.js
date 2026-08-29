export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const url = new URL(request.url);
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
