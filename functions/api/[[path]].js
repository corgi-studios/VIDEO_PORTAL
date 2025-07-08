import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// No CORS middleware is needed here because the proxy worker handles it.

// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  // Read the identity provider type from the header set by the proxy worker
  const idpType = c.req.header('X-User-IDP-Type');

  if (idpType === 'azureAD') {
    await next(); // Proceed if admin
  } else {
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }
};

// --- API Routes ---
// GET route for everyone
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// POST route protected by the admin middleware
app.post('/api/admin/videos', adminOnly, async (c) => {
    try {
        const videos = await c.req.json();
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Failed to save videos.' }, 500);
    }
});

export const onRequest = handle(app);
