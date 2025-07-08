document.addEventListener('DOMContentLoaded', () => {
    let isAdmin = false;
    let allVideos = [];
    let allNotifications = [];

    const userInfoEl = document.getElementById('user-info');
    const signOutButton = document.getElementById('sign-out-button');
    const adminPanel = document.getElementById('admin-panel');
    const addVideoForm = document.getElementById('add-video-form');
    const gallery = document.getElementById('video-gallery');
    const searchBar = document.getElementById('search-bar');
    const sortOptions = document.getElementById('sort-options');
    const notificationArea = document.getElementById('notification-area');
    const addNotificationForm = document.getElementById('add-notification-form');
    const deleteAllVideosBtn = document.getElementById('delete-all-videos');

    const initializeApp = async () => {
        signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;
        try {
            // Call our new API endpoint to get the identity
            const response = await fetch('/api/get-identity', { credentials: 'include' });
            const identity = await response.json();

            if (identity && identity.email) {
                userInfoEl.textContent = `Signed in as: ${identity.email}`;
            } else {
                userInfoEl.textContent = 'Signed in';
            }
            if (identity && identity.idp && identity.idp.type === 'azureAD') {
                isAdmin = true;
                adminPanel.style.display = 'block';
            }
        } catch(e) {
            console.error("Could not get identity from API", e);
            userInfoEl.textContent = 'Error verifying login.';
        }
        loadNotifications();
        loadAndRenderVideos();
    };

    const loadNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', { credentials: 'include' });
            allNotifications = await response.json();
            renderNotifications();
        } catch (e) { console.error("Failed to load notifications", e); }
    };

    const renderNotifications = () => {
        if (allNotifications && allNotifications.length > 0) {
            notificationArea.style.display = 'block';
            notificationArea.innerHTML = '<h2>Announcements</h2>';
            allNotifications.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.innerHTML = `<h4>${note.title}</h4><p>${note.content}</p><small>Posted: ${new Date(note.date).toLocaleDateString()}</small>`;
                notificationArea.appendChild(noteEl);
            });
        } else {
            notificationArea.style.display = 'none';
        }
    };

    const loadAndRenderVideos = async () => {
        try {
            const response = await fetch('/api/videos', { credentials: 'include' });
            allVideos = await response.json() || [];
            applyFiltersAndSort();
        } catch (error) {
            gallery.innerHTML = '<p>Could not load videos.</p>';
        }
    };

    const applyFiltersAndSort = () => {
        let videosToDisplay = [...allVideos];
        const searchTerm = searchBar.value.toLowerCase();
        if (searchTerm) {
            videosToDisplay = videosToDisplay.filter(video => video.title.toLowerCase().includes(searchTerm));
        }
        const sortValue = sortOptions.value;
        videosToDisplay.sort((a, b) => {
            switch (sortValue) {
                case 'alpha-asc': return a.title.localeCompare(b.title);
                case 'alpha-desc': return b.title.localeCompare(a.title);
                case 'date-asc': return new Date(a.postedDate) - new Date(b.postedDate);
                default: return new Date(b.postedDate) - new Date(a.postedDate);
            }
        });
        renderGallery(videosToDisplay);
    };

    const renderGallery = (videos) => {
        gallery.innerHTML = '';
        videos.forEach(video => {
            const container = document.createElement('div');
            container.className = 'video-container';
            const originalIndex = allVideos.findIndex(v => v.id === video.id);
            const adminActionsHTML = isAdmin ? `<div class="admin-actions" style="display: block;"><button class="button-danger" onclick="window.deleteVideo(${originalIndex})">Delete</button></div>` : '';
            container.innerHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe></div><div class="video-info"><h3>${video.title}</h3><p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p><p class="video-description">${video.description || 'No description.'}</p>${adminActionsHTML}</div>`;
            gallery.appendChild(container);
        });
    };

    window.deleteVideo = (index) => {
        if (confirm(`Are you sure you want to delete "${allVideos[index].title}"?`)) {
            allVideos.splice(index, 1);
            saveVideoChanges();
        }
    };

    const saveVideoChanges = async () => {
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allVideos),
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to save video changes.');
            applyFiltersAndSort();
        } catch (error) { alert('Error saving video changes.'); }
    };

    const saveNotificationChanges = async () => {
        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allNotifications),
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to save notification changes.');
            loadNotifications();
        } catch (error) { alert('Error saving notification changes.'); }
    };

    searchBar.addEventListener('input', applyFiltersAndSort);
    sortOptions.addEventListener('change', applyFiltersAndSort);

    addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('video-url');
        const titleInput = document.getElementById('video-title');
        const descriptionInput = document.getElementById('video-description');
        const extractVideoID = (urlOrId) => {
            if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
                try {
                    const url = new URL(urlOrId);
                    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
                    return url.searchParams.get('v');
                } catch { return null; }
            }
            return urlOrId;
        };
        const videoId = extractVideoID(urlInput.value);
        if (!videoId) { alert('Invalid YouTube URL or ID.'); return; }
        allVideos.unshift({
            id: videoId, title: titleInput.value, description: descriptionInput.value, postedDate: new Date().toISOString()
        });
        saveVideoChanges();
        addVideoForm.reset();
    });

    addNotificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('notification-title');
        const contentInput = document.getElementById('notification-content');
        allNotifications.unshift({
            title: titleInput.value, content: contentInput.value, date: new Date().toISOString()
        });
        saveNotificationChanges();
        addNotificationForm.reset();
    });

    deleteAllVideosBtn.addEventListener('click', async () => {
        const confirmation = prompt('This cannot be undone. To confirm, type DELETE:');
        if (confirmation === 'DELETE') {
            try {
                const response = await fetch('/api/admin/videos/delete-all', { 
                    method: 'DELETE',
                    credentials: 'include' 
                });
                if (!response.ok) throw new Error('Failed to delete all videos.');
                allVideos = [];
                applyFiltersAndSort();
                alert('All videos have been deleted.');
            } catch (error) { alert('An error occurred while deleting videos.'); }
        } else {
            alert('Deletion cancelled.');
        }
    });

    initializeApp();
});
