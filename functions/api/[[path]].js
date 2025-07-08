import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- Identity Proxy Endpoint ---
app.get('/api/get-identity', async (c) => {
  try {
    const identityResponse = await fetch('https://corgistudios.cloudflareaccess.com/cdn-cgi/access/get-identity', { headers: c.req.headers });
    if (!identityResponse.ok) return c.json({});
    const identity = await identityResponse.json();
    return c.json(identity);
  } catch (e) {
    return c.json({ error: "Could not retrieve identity." }, 500);
  }
});

// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  try {
    const identityResponse = await fetch('https://corgistudios.cloudflareaccess.com/cdn-cgi/access/get-identity', { headers: c.req.headers });
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
app.delete('/api/admin/videos/delete-all', adminOnly, async (c) => {
    await c.env.VIDEO_PORTAL_KV.delete('VIDEOS');
    return c.json({ success: true });
});

// --- Notification Routes ---
app.get('/api/notifications', async (c) => {
    const notificationData = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notificationData || []);
});
app.post('/api/admin/notifications', adminOnly, async (c) => {
    const notifications = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
    return c.json({ success: true });
});

export const onRequest = handle(app);
