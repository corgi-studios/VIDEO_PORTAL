import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// No CORS middleware is needed in this file because the proxy worker
// that sits in front of the application handles all cross-origin issues.

// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  // Read the identity provider type from the special header
  // that is added by the 'access-proxy-worker'.
  const idpType = c.req.header('X-User-IDP-Type');

  if (idpType === 'azureAD') {
    // If the user logged in with Azure AD, they are an admin. Proceed.
    await next();
  } else {
    // If the header is missing or incorrect, deny access.
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }
};

// --- API Routes ---

// GET route for everyone. No admin check needed.
app.get('/api/videos', async (c) => {
    try {
        const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
        return c.json(videoData || []);
    } catch (e) {
        console.error("Error fetching videos from KV:", e);
        return c.json({ error: "Could not fetch video data." }, 500);
    }
});

// POST route protected by the admin middleware.
// This is used to save all video changes.
app.post('/api/admin/videos', adminOnly, async (c) => {
    try {
        const videos = await c.req.json();
        if (!Array.isArray(videos)) {
            return c.json({ error: "Invalid data format."}, 400);
        }
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        console.error("Error saving videos to KV:", e);
        return c.json({ error: 'Failed to save videos.' }, 500);
    }
});

export const onRequest = handle(app);
