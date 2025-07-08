import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- NEW: Identity Proxy Endpoint ---
// This endpoint will be called by the frontend. It securely fetches the
// user's identity from the backend and returns it. This avoids all CORS issues.
app.get('/api/get-identity', async (c) => {
  try {
    // This is a server-to-server call, so we don't need to pass headers.
    const identityResponse = await fetch('https://corgistudios.cloudflareaccess.com/cdn-cgi/access/get-identity');
    
    if (!identityResponse.ok) {
      // If the identity service fails, return an empty object.
      return c.json({});
    }
    
    const identity = await identityResponse.json();
    return c.json(identity);

  } catch (e) {
    console.error("API failed to get identity:", e);
    return c.json({ error: "Could not retrieve identity." }, 500);
  }
});


// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  try {
    const identityResponse = await fetch('https://corgistudios.cloudflareaccess.com/cdn-cgi/access/get-identity');
    if (!identityResponse.ok) throw new Error('Failed to get identity.');
    const identity = await identityResponse.json();
    if (identity.idp && identity.idp.type === 'azureAD') {
      await next();
    } else {
      return c.json({ error: 'Forbidden: Admin access required.' }, 403);
    }
  } catch (e) {
    return c.json({ error: 'Could not verify authorization.' }, 500);
  }
};


// --- Video Routes ---
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

app.post('/api/admin/videos', adminOnly, async (c) => {
    const videos = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
});

export const onRequest = handle(app);
