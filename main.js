const setupUserHeader = () => {
    try {
        const domain = window.location.origin;
        const signOutButton = document.getElementById('sign-out-button');
        signOutButton.href = `${domain}/cdn-cgi/access/logout`;
    } catch (error) {
        console.error('Could not set up user header:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    setupUserHeader();
    const gallery = document.getElementById('video-gallery');
    const loading = document.getElementById('loading');
    try {
        const response = await fetch('/api/videos', { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
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
        loading.textContent = 'Failed to load videos. Please try again later.';
        console.error('Error fetching videos:', error);
    }
});
