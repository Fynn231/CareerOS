import { it, expect, vi } from 'vitest';
import { checkBackend } from './backend-check.mjs';
it('missing or invalid public configuration names only, zero fetch', async () => {
 for (const env of [{}, {NEXT_PUBLIC_SUPABASE_URL:'https://secret.example/path?token=secret', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_secret'}]) {
 const fetcher = vi.fn(); const result = await checkBackend(env, fetcher);
 expect(result.code).not.toBe(0); expect(fetcher).not.toHaveBeenCalled();
 expect(result.messages.join(' ')).toContain('NEXT_PUBLIC_SUPABASE_URL'); expect(result.messages.join(' ')).not.toContain('secret');
 }
});
const configured = {NEXT_PUBLIC_SUPABASE_URL:'https://fictional.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_FICTIONAL'};
it('anonymous denial is a limited read-only signal, with no bearer or response bodies', async () => {
 const fetcher = vi.fn().mockResolvedValueOnce({status:200}).mockResolvedValueOnce({status:403});
 const result = await checkBackend(configured, fetcher);
 expect(result.code).toBe(0); expect(result.messages.join(' ')).toContain('NOT VERIFIED');
 expect(fetcher.mock.calls.map(call => call[0])).toEqual(['https://fictional.supabase.co/auth/v1/health','https://fictional.supabase.co/rest/v1/applications?select=id&limit=0']);
 for (const [,options] of fetcher.mock.calls) { expect(options.method).toBe('GET'); expect(options.headers).toEqual({apikey:configured.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}); expect(options.redirect).toBe('error'); }
});
it('anonymous 200 including empty data requires review and redacts provider data', async () => {
 const fetcher = vi.fn().mockResolvedValueOnce({status:200}).mockResolvedValueOnce({status:200, text: () => 'secret-user-record'});
 const result = await checkBackend(configured, fetcher);
 expect(result.code).not.toBe(0); expect(result.messages.join(' ')).toContain('review-needed');
 expect(result.messages.join(' ')).not.toContain('secret-user-record'); expect(result.messages.join(' ')).not.toContain(configured.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
});
it('health HTTP failure stops before applications and prints fixed redacted diagnostics', async () => {
 const fetcher = vi.fn().mockResolvedValue({status:503, statusText:'secret', text:()=>'secret'});
 const result = await checkBackend(configured, fetcher);
 expect(result.code).not.toBe(0); expect(fetcher).toHaveBeenCalledTimes(1);
 expect(result.messages).toContain('Health HTTP failure.'); expect(result.messages.join(' ')).not.toContain('secret');
});
it('network failures never print exception URLs, keys or provider bodies', async () => {
 const result = await checkBackend(configured, vi.fn().mockRejectedValue(new Error('https://secret.test/?key=secret')));
 expect(result.code).not.toBe(0); expect(result.messages).toContain('Network failure.'); expect(result.messages.join(' ')).not.toContain('secret');
});
it('bounds requests even if fetch never settles and aborts on timeout', async () => {
 vi.useFakeTimers();
 try {
 const fetcher = vi.fn<typeof fetch>(() => new Promise<Response>(() => {}));
 const pending = checkBackend(configured, fetcher, 25);
 await vi.advanceTimersByTimeAsync(26);
 expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
 const result = await pending; expect(result.messages).toContain('Request timed out.'); expect(result.code).not.toBe(0);
 } finally {vi.useRealTimers();}
});
it('rejects unsafe origins and recognizable privileged keys before fetch, accepts local public config', async () => {
 for (const url of ['http://fictional.supabase.co','https://user:pass@fictional.supabase.co','https://fictional.supabase.co/path','https://fictional.supabase.co?secret=1','https://fictional.supabase.co/#x','https://other.example']) {
 const fetcher = vi.fn(); const result = await checkBackend({...configured,NEXT_PUBLIC_SUPABASE_URL:url},fetcher); expect(result.code).toBe(1); expect(fetcher).not.toHaveBeenCalled();
 }
 for (const key of ['sb_secret_FICTIONAL', 'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature']) {
 const fetcher = vi.fn(); expect((await checkBackend({...configured,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key},fetcher)).code).toBe(1); expect(fetcher).not.toHaveBeenCalled();
 }
 for (const url of ['http://127.0.0.1:54321','http://localhost:54321','http://[::1]:54321']) {
 const fetcher = vi.fn().mockResolvedValueOnce({status:200}).mockResolvedValueOnce({status:401}); expect((await checkBackend({...configured,NEXT_PUBLIC_SUPABASE_URL:url},fetcher)).code).toBe(0);
 }
});
it('releases each completed request after headers without reading provider bodies', async () => {
 const responses = [new Response('fictional health body', {status:200}), new Response('fictional denied body', {status:403})];
 const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1]);
 const result = await checkBackend(configured, fetcher);
 expect(result.code).toBe(0);
 expect(fetcher).toHaveBeenCalledTimes(2);
 for (const [,options] of fetcher.mock.calls) expect(options?.signal?.aborted).toBe(true);
 for (const response of responses) expect(response.bodyUsed).toBe(false);
});
