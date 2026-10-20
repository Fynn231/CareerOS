export const unverified = 'Schema/owner isolation/persistence NOT VERIFIED without authenticated integration tests.';
export function validateConfig(env) {
  const invalid = [];
  let origin;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    const hosted = url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.port;
    const local = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if ((!hosted && !local) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    origin = url.origin;
  } catch { invalid.push('NEXT_PUBLIC_SUPABASE_URL'); }
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let publicKey = typeof key === 'string' && /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (typeof key === 'string' && key.split('.').length === 3) {
    try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { publicKey = false; }
  }
  if (!publicKey) invalid.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return { invalid, origin, key };
}
export async function checkBackend(env, fetcher = fetch, timeoutMs = 5000) {
  const { invalid, origin, key } = validateConfig(env);
  if (invalid.length) return { code: 1, messages: [`Configuration missing or invalid: ${invalid.join(', ')}`, unverified] };
  const messages = [];
  for (const path of ['/auth/v1/health', '/rest/v1/applications?select=id&limit=0']) {
    let response;
    const controller = new AbortController();
    let timedOut = false;
    let timer;
    try {
      response = await Promise.race([
        Promise.resolve().then(() => fetcher(origin + path, {method: 'GET', headers: {apikey: key}, redirect: 'error', signal: controller.signal})),
        new Promise((_, reject) => { timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new Error()); }, Math.max(1, Math.min(timeoutMs, 10000))); }),
      ]);
    } catch { return {code: 1, messages: [timedOut ? 'Request timed out.' : 'Network failure.', unverified]}; }
    finally {
      clearTimeout(timer);
      // Status-only diagnostic: stop unread response streams once headers arrive.
      controller.abort();
    }
    if (path.startsWith('/auth') && response.status !== 200) return {code: 1, messages: ['Health HTTP failure.', unverified]};
    if (!path.startsWith('/auth') && ![200, 401, 403].includes(response.status)) return {code: 1, messages: ['Applications HTTP failure.', unverified]};
    messages.push(path.startsWith('/auth') ? 'Health HTTP success.' : 'Anonymous request denied; schema presence and RLS correctness cannot be inferred from 401/403.');
    if (!path.startsWith('/auth') && response.status === 200) return {code: 1, messages: ['Anonymous HTTP 200: review-needed; strict anonymous denial not verified.', unverified]};
  }
  return { code: 0, messages: [...messages, unverified] };
}
