document.addEventListener('DOMContentLoaded', async () => {
    let isAdmin = false;
    let currentVideos = [];

    const adminPanel = document.getElementById('admin-panel');
    const addVideoForm = document.getElementById('add-video-form');
    const gallery = document.getElementById('video-gallery');
    const userInfoEl = document.getElementById('user-info');
    const signOutButton = document.getElementById('sign-out-button');

    // --- Main Initialization Function ---
    const initializeApp = async () => {
        signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;

        // We no longer need to fetch. We just check the response headers of the page itself.
        // This is a more advanced technique but avoids all CORS issues.
        try {
            // The proxy worker adds the identity to the response headers of the initial page load.
            const response = await fetch(window.location.href);
            const userEmail = response.headers.get('X-User-Email');
            const idpType = response.headers.get('X-User-IDP-Type');

            if (userEmail) {
                userInfoEl.textContent = `Signed in as: ${userEmail}`;
            } else {
                userInfoEl.textContent = 'Signed in';
            }
            
            if (idpType === 'azureAD') {
                isAdmin = true;
                adminPanel.style.display = 'block';
            }
        } catch(e) {
            console.error("Could not read identity headers", e);
            userInfoEl.textContent = 'Error verifying login.';
        }

        loadAndRenderVideos();
    };

    // --- Data and Rendering (Unchanged from before) ---
    const loadAndRenderVideos = async () => { /* ... same as before ... */ };
    const renderGallery = () => { /* ... same as before ... */ };
    
    // --- Admin Functions (Unchanged from before) ---
    window.deleteVideo = (index) => { /* ... same as before ... */ };
    const saveChanges = async () => { /* ... same as before ... */ };
    
    // --- Event Listeners (Unchanged from before) ---
    addVideoForm.addEventListener('submit', (e) => { /* ... same as before ... */ });

    // --- Helper Functions (to be included) ---
    loadAndRenderVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            currentVideos = response.ok ? await response.json() : [];
            renderGallery();
        } catch (error) {
            console.error("Failed to load videos:", error);
            gallery.innerHTML = '<p>Could not load videos.</p>';
        }
    };
    renderGallery = () => {
        gallery.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const container = document.createElement('div');
            container.className = 'video-container';
            const adminActionsHTML = isAdmin ? `<div class="admin-actions" style="display: block;"><button class="button-danger" onclick="window.deleteVideo(${index})">Delete</button></div>` : '';
            container.innerHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe></div><div class="video-info"><h3>${video.title}</h3><p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p><p class="video-description">${video.description || 'No description.'}</p>${adminActionsHTML}</div>`;
            gallery.appendChild(container);
        });
    };
    window.deleteVideo = (index) => {
        if (confirm(`Are you sure you want to delete "${currentVideos[index].title}"?`)) {
            currentVideos.splice(index, 1);
            saveChanges();
        }
    };
    saveChanges = async () => {
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos)
            });
            if (!response.ok) throw new Error('Failed to save changes.');
            loadAndRenderVideos();
        } catch (error) {
            console.error("Save failed:", error);
            alert('Error saving changes. Check console for details.');
        }
    };
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
        if (!videoId) {
            alert('Invalid YouTube URL or ID.');
            return;
        }
        currentVideos.unshift({
            id: videoId,
            title: titleInput.value,
            description: descriptionInput.value,
            postedDate: new Date().toISOString()
        });
        saveChanges();
        addVideoForm.reset();
    });

    // --- Start the App ---
    initializeApp();
});
