// This version uses explicit, full paths to fix the 404 Not Found error.

import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- PUBLIC/MEMBER ROUTE ---
// We now define the FULL path, including /api/.
app.get('/api/videos', async (c) => {
  const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
  if (!videoData) {
    return c.json([]);
  }
  return c.json(videoData);
});

// --- ADMIN-ONLY ROUTES ---
// We also define the FULL path for the admin route.
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

// The handler no longer needs a base path because we defined the full paths above.
export const onRequest = handle(app);
