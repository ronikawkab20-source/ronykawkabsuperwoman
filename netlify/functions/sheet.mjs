// Server-side relay to the Google Apps Script endpoint.
// The Apps Script URL lives in the Netlify environment variable GOOGLE_SCRIPT_URL and never reaches the browser,
// so the endpoint can no longer be copied out of the page source and spammed.
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?superwoman\.(fitness-maestro|ronykawkab)\.com|[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app)$/;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const origin = req.headers.get('origin');
  if (origin && !ALLOWED_ORIGIN.test(origin)) return new Response('Forbidden', { status: 403 });
  if (!SCRIPT_URL) return Response.json({ ok: false, error: 'GOOGLE_SCRIPT_URL is not set' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (body && body.website) return Response.json({ ok: true }); // honeypot
  const text = JSON.stringify(body).slice(0, 20000); // cap payload size

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: text,
      redirect: 'follow',
    });
    return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json({ ok: false, error: 'upstream unreachable' }, { status: 502 });
  }
};

export const config = { path: '/api/sheet' };
