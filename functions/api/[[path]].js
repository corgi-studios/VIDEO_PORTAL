// This is the corrected, pure JavaScript version of the API file.

import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

// The TypeScript 'interface' has been removed to make this pure JavaScript.
// The 'c.env' binding will still work correctly because you configured it in the dashboard.
const app = new Hono();

// --- PUBLIC/MEMBER ROUTE ---
// Fetches the list of videos.
app.get('/videos', async (c) => {
  // The 'c.env' object is automatically available in the context.
  const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
  if (!videoData) {
    // Return an empty array if no videos exist yet. This is better for the frontend.
    return c.json([]);
  }
  return c.json(videoData);
});

// --- ADMIN-ONLY ROUTES ---
// These routes will still be protected by your Cloudflare Access policy.
app.post('/admin/videos', async (c) => {
  try {
    const videos = await c.req.json();
    if (!Array.isArray(videos)) {
      return c.json({ error: 'Invalid data format.' }, 400);
    }
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
  } catch (e) {
    console.error("Error in /admin/videos:", e);
    return c.json({ error: 'Failed to update videos.' }, 500);
  }
});

// This sets up the function to handle all requests starting with /api
export const onRequest = handle(app, '/api');
