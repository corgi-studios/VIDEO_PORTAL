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

// --- NEW: ONE-TIME-USE DATA CLEARING ROUTE ---
// This route will delete the potentially corrupt video list.
app.get('/api/admin/clear-data', async (c) => {
    try {
        await c.env.VIDEO_PORTAL_KV.delete('VIDEOS');
        return c.text('Video data has been cleared successfully. You can now return to the admin panel.');
    } catch (e) {
        console.error('FAILED TO CLEAR DATA:', e);
        return c.text(`Failed to clear data. Error: ${e.message}`, 500);
    }
});


// --- Existing Video Routes ---
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

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
