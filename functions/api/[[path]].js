import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS middleware
app.use('/api/*', cors({
  origin: ['https://members.corgistudios.tech', 'https://video-portal.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// --- Secure Admin-Only Middleware ---
const adminOnly = async (c, next) => {
  try {
    const identityResponse = await fetch(`${new URL(c.req.url).origin}/cdn-cgi/access/get-session`, { headers: c.req.headers });
    if (!identityResponse.ok) throw new Error('Failed to get session.');
    
    const identity = await identityResponse.json();

    // Securely check if the Identity Provider type is Azure AD
    if (identity.idp && identity.idp.type === 'azureAD') {
      await next(); // Proceed if admin
    } else {
      return c.json({ error: 'Forbidden: Admin access required.' }, 403);
    }
  } catch (e) {
    console.error('Admin authorization check failed:', e);
    return c.json({ error: 'Could not verify authorization.' }, 500);
  }
};

// --- API Routes ---
// GET route for everyone
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// POST route protected by the admin middleware
app.post('/api/admin/videos', adminOnly, async (c) => {
    try {
        const videos = await c.req.json();
        await c.env.VIDEO_PORTAL_KV.put('VIDEOS', JSON.stringify(videos));
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Failed to save videos.' }, 500);
    }
});

export const onRequest = handle(app);
