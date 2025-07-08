document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentVideos = [];
    let currentlyEditingIndex = -1;
    let currentNotifications = [];

    // --- Video Management Elements ---
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const addVideoForm = document.getElementById('add-video-form');
    const videoListEl = document.getElementById('video-list');
    const saveAllButton = document.getElementById('save-all-changes');
    const statusVideosEl = document.getElementById('status-videos');
    const backButton = document.getElementById('back-button');
    const detailForm = document.getElementById('detail-form');
    // ... (other video detail elements)

    // --- Notification Management Elements ---
    const addNotificationForm = document.getElementById('add-notification-form');
    const notificationListEl = document.getElementById('notification-list');
    const saveNotificationsButton = document.getElementById('save-notifications');
    const statusNotificationsEl = document.getElementById('status-notifications');

    // --- General Elements ---
    const signOutButton = document.getElementById('sign-out-button');
    signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;

    // --- Video Functions ---
    const loadVideos = async () => {
        try {
            const response = await fetch('/api/videos', { credentials: 'include' });
            currentVideos = response.ok ? await response.json() : [];
            renderVideoList();
        } catch (error) { statusVideosEl.textContent = 'Could not load videos.'; }
    };
    const renderVideoList = () => { /* ... (this function is unchanged) ... */ };
    // ... (all other video-related functions are unchanged) ...

    // --- NEW: Notification Functions ---
    const loadNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', { credentials: 'include' });
            currentNotifications = response.ok ? await response.json() : [];
            renderNotificationList();
        } catch (error) { statusNotificationsEl.textContent = 'Could not load notifications.'; }
    };

    const renderNotificationList = () => {
        notificationListEl.innerHTML = '';
        currentNotifications.forEach((note, index) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `<span><strong>${note.title}</strong>: ${note.content.substring(0, 50)}...</span>`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'button-danger';
            deleteButton.onclick = () => {
                currentNotifications.splice(index, 1);
                renderNotificationList();
            };
            li.appendChild(deleteButton);
            notificationListEl.appendChild(li);
        });
    };

    // --- Event Listeners ---
    addNotificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('notification-title');
        const contentInput = document.getElementById('notification-content');
        currentNotifications.unshift({
            title: titleInput.value,
            content: contentInput.value,
            date: new Date().toISOString()
        });
        renderNotificationList();
        addNotificationForm.reset();
    });

    saveNotificationsButton.addEventListener('click', async () => {
        statusNotificationsEl.textContent = 'Saving...';
        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentNotifications),
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            statusNotificationsEl.textContent = 'Notifications saved successfully!';
        } catch (error) {
            statusNotificationsEl.textContent = `Error: ${error.message}`;
        }
        setTimeout(() => statusNotificationsEl.textContent = '', 3000);
    });

    // ... (all existing video event listeners are unchanged) ...

    // --- Initial Load ---
    loadVideos();
    loadNotifications();

    // NOTE: The following is the unchanged video logic for brevity.
    // Make sure it's included in your final file.
    const extractVideoID = (urlOrId) => {
        if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
            try {
                const url = new URL(urlOrId);
                if (url.hostname === 'youtu.be') return url.pathname.slice(1);
                return url.searchParams.get('v');
            } catch (e) { return null; }
        }
        return urlOrId;
    };
    const switchView = (view) => {
        if (view === 'detail') {
            listView.style.display = 'none';
            detailView.style.display = 'block';
        } else {
            detailView.style.display = 'none';
            listView.style.display = 'block';
        }
    };
    renderVideoList = () => {
        videoListEl.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const li = document.createElement('li');
            li.className = 'video-list-item list-item';
            li.innerHTML = `<span>${video.title}</span>`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'button-danger';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this video?')) {
                    currentVideos.splice(index, 1);
                    renderVideoList();
                }
            };
            li.onclick = () => showDetailView(index);
            li.appendChild(deleteButton);
            videoListEl.appendChild(li);
        });
    };
    const showDetailView = (index) => {
        currentlyEditingIndex = index;
        const video = currentVideos[index];
        const detailVideoEmbed = document.getElementById('detail-video-embed');
        const detailTitle = document.getElementById('detail-title');
        const detailPostedDate = document.getElementById('detail-posted-date');
        const detailEditTitle = document.getElementById('detail-edit-title');
        const detailEditDescription = document.getElementById('detail-edit-description');
        detailTitle.textContent = `Edit: ${video.title}`;
        detailVideoEmbed.src = `https://www.youtube.com/embed/${video.id}`;
        detailPostedDate.textContent = new Date(video.postedDate).toLocaleDateString();
        detailEditTitle.value = video.title;
        detailEditDescription.value = video.description || '';
        switchView('detail');
    };
    addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('video-url');
        const titleInput = document.getElementById('video-title');
        const videoId = extractVideoID(urlInput.value);
        if (!videoId) {
            alert('Could not extract a valid YouTube Video ID.');
            return;
        }
        currentVideos.unshift({
            id: videoId,
            title: titleInput.value,
            description: '',
            postedDate: new Date().toISOString()
        });
        renderVideoList();
        addVideoForm.reset();
    });
    detailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentlyEditingIndex > -1) {
            currentVideos[currentlyEditingIndex].title = document.getElementById('detail-edit-title').value;
            currentVideos[currentlyEditingIndex].description = document.getElementById('detail-edit-description').value;
            renderVideoList();
            switchView('list');
        }
    });
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('list');
    });
    saveAllButton.addEventListener('click', async () => {
        statusVideosEl.textContent = 'Saving...';
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos),
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.success) {
                statusVideosEl.textContent = 'Video changes saved successfully!';
            } else {
                throw new Error(result.error || 'Failed to save.');
            }
        } catch (error) {
            statusVideosEl.textContent = `Error: ${error.message}`;
        }
        setTimeout(() => statusVideosEl.textContent = '', 3000);
    });
});
