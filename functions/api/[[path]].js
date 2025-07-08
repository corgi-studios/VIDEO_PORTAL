import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// --- CONFIGURATION ---
// IMPORTANT: This email MUST match the email you use in your Admin Access Policy.
const ADMIN_EMAIL = 'quangnguyen@corgistudios.tech';

// CORS middleware (unchanged)
app.use('/api/*', cors({
  origin: ['https://video.corgistudios.tech', 'https://admin-video.corgistudios.tech', 'https://video-portal.pages.dev'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// --- Authorization Middleware ---
// This is a new function that will run before any admin route.
const adminOnly = async (c, next) => {
  try {
    // Get the user's identity from their session cookie.
    const identityResponse = await fetch(`${new URL(c.req.url).origin}/cdn-cgi/access/get-session`, { headers: c.req.headers });
    const identity = await identityResponse.json();

    // Check if the logged-in user's email matches the configured ADMIN_EMAIL.
    if (identity && identity.email === ADMIN_EMAIL) {
      // If they are the admin, proceed to the actual route handler.
      await next();
    } else {
      // If they are not the admin, return a "Forbidden" error.
      return c.json({ error: 'Forbidden. You are not authorized to perform this action.' }, 403);
    }
  } catch (e) {
    return c.json({ error: 'Could not verify authorization.' }, 500);
  }
};


// --- Video Routes ---
// This route is public for all logged-in users, so it does NOT use the adminOnly middleware.
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// This route is for admins only, so we add the 'adminOnly' middleware.
app.post('/api/admin/videos', adminOnly, async (c) => {
    const videos = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
});


// --- Notification Routes ---
// This route is public for all logged-in users.
app.get('/api/notifications', async (c) => {
    const notifications = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notifications || []);
});

// This route is for admins only, so we add the 'adminOnly' middleware.
app.post('/api/admin/notifications', adminOnly, async (c) => {
    const notifications = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
    return c.json({ success: true });
});


export const onRequest = handle(app);
