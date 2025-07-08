import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS middleware to allow your frontend to talk to the API
app.use('/api/*', cors({
  origin: ['https://members.corgistudios.tech', 'https://video-portal.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// --- Secure Admin-Only Middleware ---
// This function checks if the logged-in user is an admin
const adminOnly = async (c, next) => {
  try {
    // Use the correct absolute URL for the identity endpoint that you found
    const identityResponse = await fetch('https://corgistudios.cloudflareaccess.com/cdn-cgi/access/get-identity');
    
    if (!identityResponse.ok) {
      throw new Error('Failed to get identity from Cloudflare Access.');
    }
    
    const identity = await identityResponse.json();

    // Securely check if the Identity Provider type is 'azureAD'
    if (identity.idp && identity.idp.type === 'azureAD') {
      await next(); // If it is, proceed to the API action
    } else {
      // If not, block the request with a "Forbidden" error
      return c.json({ error: 'Forbidden: Admin access required.' }, 403);
    }
  } catch (e) {
    console.error('Admin authorization check failed:', e);
    return c.json({ error: 'Could not verify authorization.' }, 500);
  }
};

// --- API Routes ---

// GET route for all logged-in users to view videos
app.get('/api/videos', async (c) => {
    const videoData = await c.env.VIDEO_PORTAL_KV.get('VIDEOS', { type: 'json' });
    return c.json(videoData || []);
});

// POST route for admins to save videos, protected by the adminOnly middleware
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
