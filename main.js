document.addEventListener('DOMContentLoaded', async () => {
    // Set up the sign-out button
    document.getElementById('sign-out-button').href = `${window.location.origin}/cdn-cgi/access/logout`;

    const gallery = document.getElementById('video-gallery');
    const loading = document.getElementById('loading');
    try {
        // Fetch the video list, including credentials for Cloudflare Access
        const response = await fetch('/api/videos', { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const videos = await response.json();
        loading.style.display = 'none';

        if (videos && videos.length > 0) {
            videos.forEach(video => {
                const container = document.createElement('div');
                container.className = 'video-container';
                const embedHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                const infoHTML = `<div class="video-info"><h3>${video.title}</h3><p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p><p class="video-description">${video.description || 'No description available.'}</p></div>`;
                container.innerHTML = embedHTML + infoHTML;
                gallery.appendChild(container);
            });
        } else {
            gallery.innerHTML = '<p>No videos are available at this time.</p>';
        }
    } catch (error) {
        loading.textContent = 'Failed to load videos. Please check your connection and try again.';
        console.error('Error fetching videos:', error);
    }
});
