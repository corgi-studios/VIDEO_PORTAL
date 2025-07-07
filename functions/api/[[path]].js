// This single file handles all API requests for your Pages project.
// It uses Hono, a lightweight web framework.

import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

// This defines the environment, including our KV binding.
export interface Env {
  Bindings: {
    VIDEO_PORTAL_KV: KVNamespace;
  };
}

const app = new Hono<Env>();

// --- PUBLIC/MEMBER ROUTE ---
// Fetches the list of videos. The path is now just '/videos'
// because the folder structure already puts it under '/api/'.
app.get('/videos', async (c) => {
  const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
  if (!videoData) {
    return c.json([]); // Return an empty array if no videos exist yet
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
    return c.json({ error: 'Failed to update videos.' }, 500);
  }
});

// This sets up the function to handle all requests
export const onRequest = handle(app, '/api');
