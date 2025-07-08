import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// This CORS middleware is essential for the admin panel to work.
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech', 'https://video-portal.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// GET route for users to fetch videos
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// POST route for admins to save videos
app.post('/api/admin/videos', async (c) => {
    try {
        const videos = await c.req.json();
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        console.error("Error saving videos:", e);
        return c.json({ error: 'Failed to update videos.' }, 500);
    }
});

export const onRequest = handle(app);
