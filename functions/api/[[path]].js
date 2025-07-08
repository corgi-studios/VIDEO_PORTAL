import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS middleware (unchanged)
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech', 'https://admin-video.corgistudios.tech', 'https://video-portal.pages.dev'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// The 'adminOnly' authorization middleware function has been completely removed.

// --- Video Routes ---

// This route remains public for all logged-in users.
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// This route is now protected only by the Cloudflare Access application rule.
app.post('/api/admin/videos', async (c) => {
    try {
        const videos = await c.req.json();
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Failed to update videos.' }, 500);
    }
});


// --- Notification Routes ---

// This route remains public for all logged-in users.
app.get('/api/notifications', async (c) => {
    const notifications = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notifications || []);
});

// This route is now protected only by the Cloudflare Access application rule.
app.post('/api/admin/notifications', async (c) => {
    try {
        const notifications = await c.req.json();
        await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Failed to update notifications.' }, 500);
    }
});


export const onRequest = handle(app);
