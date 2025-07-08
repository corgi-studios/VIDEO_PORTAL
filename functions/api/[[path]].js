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

// --- NEW: DIAGNOSTIC TEST ROUTE ---
// This route will test the connection to the KV Namespace.
app.get('/api/test-kv', async (c) => {
    try {
        // Attempt to get a value from the KV store.
        // It doesn't matter if the key exists or not, we just need to see if the command fails.
        await c.env.VIDEO_PORTAL_KV.get('test-key');
        
        // If the command succeeds, return a success message.
        return c.text('KV Namespace connection is OK.');

    } catch (e) {
        // If the command fails, it means the binding is broken.
        console.error('KV BINDING TEST FAILED:', e);
        return c.text(`KV Namespace connection FAILED. Error: ${e.message}`, 500);
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
