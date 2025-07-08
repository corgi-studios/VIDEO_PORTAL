import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
// Import the CORS middleware from Hono
import { cors } from 'hono/cors';

const app = new Hono();

// *** THIS IS THE FIX ***
// Add the CORS middleware to handle browser pre-flight requests.
// This tells the browser that it's safe to make authenticated requests from your frontend.
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech', 'https://video-portal.pages.dev'], // Add both your domains
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));


// --- Video GET Route (for users) ---
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// --- Video POST Route (for admin) ---
app.post('/api/admin/videos', async (c) => {
    try {
        const videos = await c.req.json();
        if (!Array.isArray(videos)) {
            return c.json({ error: 'Invalid data format.' }, 400);
        }
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        console.error("Error in /api/admin/videos:", e);
        return c.json({ error: 'Failed to update videos.' }, 500);
    }
});

export const onRequest = handle(app);
