const setupUserHeader = () => {
    const domain = window.location.origin;
    document.getElementById('sign-out-button').href = `${domain}/cdn-cgi/access/logout`;
};

// New function to load and display notifications
const loadNotifications = async () => {
    const notificationArea = document.getElementById('notification-area');
    try {
        const response = await fetch('/api/notifications', { credentials: 'include' });
        if (!response.ok) return; // Fail silently if notifications can't be loaded

        const notifications = await response.json();
        if (notifications && notifications.length > 0) {
            notificationArea.innerHTML = ''; // Clear any previous content
            notifications.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.className = 'notification';
                noteEl.innerHTML = `
                    <h4>${note.title}</h4>
                    <p>${note.content}</p>
                    <div class="notification-date">Posted: ${new Date(note.date).toLocaleDateString()}</div>
                `;
                notificationArea.appendChild(noteEl);
            });
        } else {
            notificationArea.style.display = 'none'; // Hide the area if there are no notifications
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        notificationArea.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    setupUserHeader();
    loadNotifications(); // Load notifications when the page loads

    const gallery = document.getElementById('video-gallery');
    const loading = document.getElementById('loading');
    try {
        const response = await fetch('/api/videos', { credentials: 'include' });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        
        const videos = await response.json();
        loading.style.display = 'none';
        if (videos && videos.length > 0) {
            videos.forEach(video => {
                const container = document.createElement('div');
                container.className = 'video-container';
                const embedHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe></div>`;
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
