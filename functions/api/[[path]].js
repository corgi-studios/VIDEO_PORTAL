import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// The ADMIN_EMAIL constant and the adminOnly middleware function have been removed.

// CORS middleware updated for the single domain.
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech', 'https://video-portal.pages.dev'], // Updated list
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// --- Video Routes ---
// Public for all logged-in users
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// Admin-only route, now protected solely by the Cloudflare Access application rule.
app.post('/api/admin/videos', async (c) => {
    const videos = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
});


// --- Notification Routes ---
// Public for all logged-in users
app.get('/api/notifications', async (c) => {
    const notifications = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notifications || []);
});

// Admin-only route, now protected solely by the Cloudflare Access application rule.
app.post('/api/admin/notifications', async (c) => {
    const notifications = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
    return c.json({ success: true });
});


export const onRequest = handle(app);
