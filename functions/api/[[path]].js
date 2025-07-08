import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- Secure Admin-Only Middleware ---
// This function checks the special header added by the proxy worker.
const adminOnly = async (c, next) => {
  const idpType = c.req.header('X-User-IDP-Type');
  if (idpType === 'azureAD') {
    await next(); // If the header shows an Azure AD login, proceed.
  } else {
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }
};

// --- API Routes ---

// --- Video Routes ---
// GET videos (for everyone)
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// POST to save video list (admins only)
app.post('/api/admin/videos', adminOnly, async (c) => {
    const videos = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
});

// DELETE all videos (admins only)
app.delete('/api/admin/videos/delete-all', adminOnly, async (c) => {
    await c.env.VIDEO_PORTAL_KV.delete('VIDEOS');
    return c.json({ success: true });
});


// --- Notification Routes ---
// GET notifications (for everyone)
app.get('/api/notifications', async (c) => {
    const notificationData = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notificationData || []);
});

// POST to save notification list (admins only)
app.post('/api/admin/notifications', adminOnly, async (c) => {
    const notifications = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
    return c.json({ success: true });
});

export const onRequest = handle(app);
