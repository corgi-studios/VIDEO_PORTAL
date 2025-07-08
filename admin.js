document.addEventListener('DOMContentLoaded', () => {
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const addVideoForm = document.getElementById('add-video-form');
    const videoListEl = document.getElementById('video-list');
    const saveAllButton = document.getElementById('save-all-changes');
    const statusEl = document.getElementById('status');
    const signOutButton = document.getElementById('sign-out-button');
    const backButton = document.getElementById('back-button');
    const detailForm = document.getElementById('detail-form');
    const detailVideoEmbed = document.getElementById('detail-video-embed');
    const detailTitle = document.getElementById('detail-title');
    const detailPostedDate = document.getElementById('detail-posted-date');
    const detailEditTitle = document.getElementById('detail-edit-title');
    const detailEditDescription = document.getElementById('detail-edit-description');

    let currentVideos = [];
    let currentlyEditingIndex = -1;

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
        listView.style.display = (view === 'list') ? 'block' : 'none';
        detailView.style.display = (view === 'detail') ? 'block' : 'none';
    };

    const loadVideos = async () => {
        try {
            const response = await fetch('/api/videos', { credentials: 'include' });
            currentVideos = response.ok ? await response.json() : [];
            renderVideoList();
        } catch (error) {
            console.error('Error loading videos:', error);
            statusEl.textContent = 'Could not load video list.';
        }
    };

    const renderVideoList = () => {
        videoListEl.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const li = document.createElement('li');
            li.className = 'video-list-item';
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
            currentVideos[currentlyEditingIndex].title = detailEditTitle.value;
            currentVideos[currentlyEditingIndex].description = detailEditDescription.value;
            renderVideoList();
            switchView('list');
        }
    });

    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('list');
    });

    saveAllButton.addEventListener('click', async () => {
        statusEl.textContent = 'Saving...';
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos),
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to save.');
            }
            statusEl.textContent = 'Changes saved successfully!';
        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
        }
        setTimeout(() => statusEl.textContent = '', 3000);
    });

    signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;
    loadVideos();
});
