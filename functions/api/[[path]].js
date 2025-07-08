import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// Helper function to decode the JWT payload
const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

// --- Identity Endpoint ---
app.get('/api/get-identity', async (c) => {
  // Cloudflare Access automatically adds this header with the user's identity JWT.
  const jwt = c.req.header('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return c.json({ error: "No identity token found." }, 401);
  }
  
  const identity = decodeJwtPayload(jwt);
  if (!identity) {
    return c.json({ error: "Failed to decode identity token." }, 500);
  }

  // Return only the necessary parts of the identity to the frontend
  return c.json({
      email: identity.email,
      idp: identity.idp
  });
});


// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  const jwt = c.req.header('Cf-Access-Jwt-Assertion');
  if (!jwt) return c.json({ error: "No identity token found." }, 401);
  
  const identity = decodeJwtPayload(jwt);
  if (identity && identity.idp && identity.idp.type === 'azureAD') {
    await next();
  } else {
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }
};

// --- Video Routes ---
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});
app.post('/api/admin/videos', adminOnly, async (c) => {
    const videos = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
    return c.json({ success: true });
});
app.delete('/api/admin/videos/delete-all', adminOnly, async (c) => {
    await c.env.VIDEO_PORTAL_KV.delete('VIDEOS');
    return c.json({ success: true });
});

// --- Notification Routes ---
app.get('/api/notifications', async (c) => {
    const notificationData = await c.env.VIDEO_PORTAL_KV.get('NOTIFICATIONS', { type: 'json' });
    return c.json(notificationData || []);
});
app.post('/api/admin/notifications', adminOnly, async (c) => {
    const notifications = await c.req.json();
    await c.env.VIDEO_PORTAL_KV.put('NOTIFICATIONS', JSON.stringify(notifications));
    return c.json({ success: true });
});

export const onRequest = handle(app);
