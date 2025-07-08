import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono();

// --- IMPORTANT: ADD YOUR TURNSTILE SECRET KEY HERE ---
const TURNSTILE_SECRET_KEY = '0x4AAAAAABkRjRe1Ixl3ZWxJkY_Eo9GA1eY'; 
// This is your admin email, used for deleting any comment.
const ADMIN_EMAIL = 'quangnguyen@corgistudios.tech';

// --- Video Routes (Unchanged) ---
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
        return c.json({ error: 'Failed to update videos.' }, 500);
    }
});


// --- NEW: Comment Routes ---

// GET all comments for a specific video
app.get('/api/comments/:videoId', async (c) => {
    const { videoId } = c.req.param();
    const comments = await c.env.VIDEO_PORTAL_KV.get(`comments_${videoId}`, { type: 'json' });
    return c.json(comments || []);
});

// POST a new comment to a video
app.post('/api/comments/:videoId', async (c) => {
    const { videoId } = c.req.param();
    const { commentText, turnstileToken } = await c.req.json();

    // 1. Get user's identity from Cloudflare Access
    const identityResponse = await fetch(`${new URL(c.req.url).origin}/cdn-cgi/access/get-session`, { headers: c.req.headers });
    const identity = await identityResponse.json();
    if (!identity.email) {
        return c.json({ error: 'Authentication required.' }, 401);
    }

    // 2. Verify the CAPTCHA token
    const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            secret: TURNSTILE_SECRET_KEY,
            response: turnstileToken,
        }),
    });
    const captchaResult = await captchaResponse.json();
    if (!captchaResult.success) {
        return c.json({ error: 'CAPTCHA validation failed.' }, 400);
    }

    // 3. Store the new comment
    const newComment = {
        id: crypto.randomUUID(),
        authorEmail: identity.email,
        text: commentText,
        timestamp: new Date().toISOString(),
    };

    const commentsKey = `comments_${videoId}`;
    const existingComments = await c.env.VIDEO_PORTAL_KV.get(commentsKey, { type: 'json' }) || [];
    existingComments.unshift(newComment); // Add new comment to the top
    await c.env.VIDEO_PORTAL_KV.put(commentsKey, JSON.stringify(existingComments));

    return c.json({ success: true, comment: newComment });
});

// DELETE a comment
app.delete('/api/comments/:videoId/:commentId', async (c) => {
    const { videoId, commentId } = c.req.param();
    
    // Get user's identity
    const identityResponse = await fetch(`${new URL(c.req.url).origin}/cdn-cgi/access/get-session`, { headers: c.req.headers });
    const identity = await identityResponse.json();
     if (!identity.email) {
        return c.json({ error: 'Authentication required.' }, 401);
    }

    const commentsKey = `comments_${videoId}`;
    const existingComments = await c.env.VIDEO_PORTAL_KV.get(commentsKey, { type: 'json' }) || [];
    
    const commentToDelete = existingComments.find(comment => comment.id === commentId);
    if (!commentToDelete) {
        return c.json({ error: 'Comment not found.' }, 404);
    }

    // Check for authorization: user is admin OR user is the author
    if (identity.email === ADMIN_EMAIL || identity.email === commentToDelete.authorEmail) {
        const updatedComments = existingComments.filter(comment => comment.id !== commentId);
        await c.env.VIDEO_PORTAL_KV.put(commentsKey, JSON.stringify(updatedComments));
        return c.json({ success: true });
    }

    return c.json({ error: 'You are not authorized to delete this comment.' }, 403);
});

export const onRequest = handle(app);
