document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let isAdmin = false;
    let currentVideos = [];

    // --- DOM Elements ---
    const userInfoEl = document.getElementById('user-info');
    const signOutButton = document.getElementById('sign-out-button');
    const adminPanel = document.getElementById('admin-panel');
    const addVideoForm = document.getElementById('add-video-form');
    const gallery = document.getElementById('video-gallery');

    // --- Helper Functions ---
    const extractVideoID = (urlOrId) => {
        if (!urlOrId) return null;
        if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
            try {
                const url = new URL(urlOrId);
                if (url.hostname === 'youtu.be') return url.pathname.slice(1);
                return url.searchParams.get('v');
            } catch { return null; }
        }
        // Assume it's a valid ID if it's not a URL
        return urlOrId;
    };

    const renderGallery = () => {
        gallery.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const container = document.createElement('div');
            container.className = 'video-container';
            
            const adminActionsHTML = isAdmin ? `
                <div class="admin-actions" style="display: block;">
                    <button class="button-danger" onclick="window.deleteVideo(${index})">Delete</button>
                </div>
            ` : '';

            container.innerHTML = `
                <div class="video-embed">
                    <iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p>
                    <p class="video-description">${video.description || 'No description.'}</p>
                    ${adminActionsHTML}
                </div>
            `;
            gallery.appendChild(container);
        });
    };

    const loadAndRenderVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            if (!response.ok) throw new Error('Failed to fetch videos');
            currentVideos = await response.json();
            renderGallery();
        } catch (error) {
            console.error("Failed to load videos:", error);
            gallery.innerHTML = '<p>Could not load videos.</p>';
        }
    };

    const saveChanges = async () => {
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos)
            });
            if (!response.ok) throw new Error('Failed to save changes.');
            loadAndRenderVideos(); // Refresh the gallery after saving
        } catch (error) {
            console.error("Save failed:", error);
            alert('Error saving changes. Check console for details.');
        }
    };

    // --- Admin Functions (exposed to window) ---
    window.deleteVideo = (index) => {
        if (confirm(`Are you sure you want to delete "${currentVideos[index].title}"?`)) {
            currentVideos.splice(index, 1);
            saveChanges();
        }
    };

    // --- Main Initialization Function ---
    const initializeApp = async () => {
        signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;

        try {
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
            console.error("Could not read identity headers from proxy worker", e);
            userInfoEl.textContent = 'Error verifying login.';
        }

        loadAndRenderVideos();
    };

    // --- Event Listeners ---
    addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('video-url');
        const titleInput = document.getElementById('video-title');
        const descriptionInput = document.getElementById('video-description');
        
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
