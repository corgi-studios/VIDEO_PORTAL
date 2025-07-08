import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
// We need to re-import the cors middleware
import { cors } from 'hono/cors';

const app = new Hono();

// *** THIS IS THE FIX ***
// The CORS middleware has been added back. This is essential for the admin panel to communicate with the API.
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech'], // Only the final domain is needed now
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

// Admin-only route, protected by Cloudflare Access rules
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
// Public for all logged-in users
app.get('/api/notifications', async (c) => {
    const notifications = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notifications || []);
});

// Admin-only route, protected by Cloudflare Access rules
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
