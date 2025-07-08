let currentUserEmail = null;

const setupUserHeader = async () => {
    try {
        const response = await fetch('/cdn-cgi/access/get-session');
        if (!response.ok) {
            document.getElementById('user-info').textContent = 'Not signed in.';
            return;
        }
        const identity = await response.json();
        if (identity && identity.email) {
            currentUserEmail = identity.email; // Store current user's email
            document.getElementById('user-info').textContent = `Signed in as: ${currentUserEmail}`;
        }
        document.getElementById('sign-out-button').href = `${window.location.origin}/cdn-cgi/access/logout`;
    } catch (error) {
        console.error('Could not fetch user identity:', error);
        document.getElementById('user-info').textContent = 'Error loading user.';
    }
};

const fetchAndRenderComments = async (videoId, commentsContainer) => {
    commentsContainer.innerHTML = 'Loading comments...';
    try {
        const response = await fetch(`/api/comments/${videoId}`);
        const comments = await response.json();
        commentsContainer.innerHTML = ''; // Clear loading message
        
        if (comments && comments.length > 0) {
            comments.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment';
                let actionsHTML = '';
                // Show actions only if the comment belongs to the current user
                if (currentUserEmail === comment.authorEmail) {
                    actionsHTML = `
                        <div class="comment-actions">
                            <button onclick="deleteComment('${videoId}', '${comment.id}')">Delete</button>
                        </div>`;
                }
                commentEl.innerHTML = `
                    <span class="comment-author">${comment.authorEmail}</span>
                    <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
                    <p class="comment-text">${comment.text}</p>
                    ${actionsHTML}
                `;
                commentsContainer.appendChild(commentEl);
            });
        } else {
            commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        }
    } catch (error) {
        commentsContainer.innerHTML = '<p>Could not load comments.</p>';
    }
};

window.deleteComment = async (videoId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
        const response = await fetch(`/api/comments/${videoId}/${commentId}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) {
            // Refresh comments for the specific video
            const videoEntry = document.querySelector(`[data-video-id="${videoId}"]`);
            if(videoEntry) {
                const commentsContainer = videoEntry.querySelector('.comments-list');
                fetchAndRenderComments(videoId, commentsContainer);
            }
        } else {
            alert('Failed to delete comment.');
        }
    } catch (error) {
        alert('An error occurred while deleting the comment.');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await setupUserHeader(); // Wait for user info before rendering
    const gallery = document.getElementById('video-gallery');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/videos');
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        
        const videos = await response.json();
        loading.style.display = 'none';

        if (videos && videos.length > 0) {
            videos.forEach(video => {
                const videoEntry = document.createElement('div');
                videoEntry.className = 'video-entry';
                videoEntry.dataset.videoId = video.id; // Add data attribute

                const commentsContainer = document.createElement('div');
                commentsContainer.className = 'comments-list';

                videoEntry.innerHTML = `
                    <div class="video-embed">
                        <iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="video-details">
                        <h3>${video.title}</h3>
                        <p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p>
                        <p class="video-description">${video.description || 'No description available.'}</p>
                        <div class="comments-section">
                            <h4>Comments</h4>
                            <form class="comment-form" onsubmit="postComment(event, '${video.id}')">
                                <textarea name="commentText" placeholder="Add a comment..." required></textarea>
                                <!-- IMPORTANT: ADD YOUR TURNSTILE SITE KEY HERE -->
                                <div class="cf-turnstile" data-sitekey="Y0x4AAAAAABkRjS9M5B4qvN97"></div>
                                <button type="submit">Post Comment</button>
                            </form>
                            <div class="comments-list-container"></div>
                        </div>
                    </div>
                `;
                gallery.appendChild(videoEntry);
                const commentsListContainer = videoEntry.querySelector('.comments-list-container');
                fetchAndRenderComments(video.id, commentsListContainer);
            });
        } else {
            gallery.innerHTML = '<p>No videos are available at this time.</p>';
        }
    } catch (error) {
        loading.textContent = 'Failed to load videos. Please try again later.';
        console.error('Error fetching videos:', error);
    }
});

window.postComment = async (event, videoId) => {
    event.preventDefault();
    const form = event.target;
    const textarea = form.querySelector('textarea');
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]').value;

    if (!turnstileToken) {
        alert('Please complete the CAPTCHA before commenting.');
        return;
    }

    try {
        const response = await fetch(`/api/comments/${videoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commentText: textarea.value,
                turnstileToken: turnstileToken
            }),
            credentials: 'include'
        });

        if (response.ok) {
            textarea.value = '';
            turnstile.reset(form.querySelector('.cf-turnstile')); // Reset captcha
            const videoEntry = document.querySelector(`[data-video-id="${videoId}"]`);
            const commentsContainer = videoEntry.querySelector('.comments-list-container');
            fetchAndRenderComments(videoId, commentsContainer);
        } else {
            const result = await response.json();
            alert(`Failed to post comment: ${result.error}`);
        }
    } catch (error) {
        alert('An error occurred.');
    }
};
