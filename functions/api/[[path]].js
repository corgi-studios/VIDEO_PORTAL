import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- Video GET Route (for users) ---
app.get('/api/videos', async (c) => {
    // Fetches the list of videos from the KV store.
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    // Always return an array, even if no data exists.
    return c.json(videoData || []);
});

// --- Video POST Route (for admin) ---
app.post('/api/admin/videos', async (c) => {
    try {
        // Gets the video list from the admin panel and saves it.
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

// All comment-related routes have been removed.

export const onRequest = handle(app);
