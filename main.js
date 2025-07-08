document.addEventListener('DOMContentLoaded', async () => {
    // --- Global State ---
    let isAdmin = false;
    let currentVideos = [];

    // --- DOM Elements ---
    const userInfoEl = document.getElementById('user-info');
    const signOutButton = document.getElementById('sign-out-button');
    const adminPanel = document.getElementById('admin-panel');
    const addVideoForm = document.getElementById('add-video-form');
    const gallery = document.getElementById('video-gallery');

    // --- Main Initialization Function ---
    const initializeApp = async () => {
        console.log("App initializing...");
        // 1. Set up the sign-out button immediately
        signOutButton.href = `${window.location.origin}/cdn-cgi/access/logout`;

        // 2. Fetch user session to determine role
        try {
            console.log("Attempting to fetch session data...");
            const response = await fetch('/cdn-cgi/access/get-session', { credentials: 'include' });
            
            console.log(`Session fetch response status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Could not get session. Status: ${response.status}, Response: ${errorText}`);
            }
            
            const session = await response.json();
            
            // *** NEW LOGGING: Print the entire session object to the console ***
            console.log("Session data received:", session);

            userInfoEl.textContent = `Signed in as: ${session.email || 'Unknown User'}`;

            // Check if the idp object and type property exist before comparing
            if (session.idp && session.idp.type === 'azureAD') {
                console.log("Admin detected! (idp.type is 'azureAD')");
                isAdmin = true;
                adminPanel.style.display = 'block'; // Show the admin panel
            } else {
                console.log("Admin not detected. Session IDP type is:", session.idp ? session.idp.type : "not present");
            }
        } catch (error) {
            // *** NEW LOGGING: Print the specific error to the console ***
            console.error("A critical error occurred during session check:", error);
            userInfoEl.textContent = 'Error verifying login status.';
        }

        // 3. Load and render videos
        loadAndRenderVideos();
    };

    // --- Data and Rendering (Unchanged) ---
    const loadAndRenderVideos = async () => {
        try {
            const response = await fetch('/api/videos', { credentials: 'include' });
            currentVideos = response.ok ? await response.json() : [];
            renderGallery();
        } catch (error) {
            console.error("Failed to load videos:", error);
            gallery.innerHTML = '<p>Could not load videos.</p>';
        }
    };

    const renderGallery = () => {
        gallery.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const container = document.createElement('div');
            container.className = 'video-container';
            const adminActionsHTML = isAdmin ? `<div class="admin-actions" style="display: block;"><button class="button-danger" onclick="window.deleteVideo(${index})">Delete</button></div>` : '';
            container.innerHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe></div><div class="video-info"><h3>${video.title}</h3><p class="video-meta">Posted: ${new Date(video.postedDate).toLocaleDateString()}</p><p class="video-description">${video.description || 'No description.'}</p>${adminActionsHTML}</div>`;
            gallery.appendChild(container);
        });
    };

    // --- Admin Functions (Unchanged) ---
    window.deleteVideo = (index) => {
        if (confirm(`Are you sure you want to delete "${currentVideos[index].title}"?`)) {
            currentVideos.splice(index, 1);
            saveChanges();
        }
    };

    const saveChanges = async () => {
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos),
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to save changes.');
            loadAndRenderVideos();
        } catch (error) {
            console.error("Save failed:", error);
            alert('Error saving changes. Check console for details.');
        }
    };

    // --- Event Listeners (Unchanged) ---
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
