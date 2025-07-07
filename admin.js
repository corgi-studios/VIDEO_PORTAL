// This new function handles fetching the user identity and setting up the header
const setupUserHeader = async () => {
    try {
        // Cloudflare Access provides this special endpoint to get user identity
        const response = await fetch('/cdn-cgi/access/get-identity');
        if (!response.ok) {
            document.getElementById('user-info').textContent = 'Not signed in.';
            return;
        }

        const identity = await response.json();
        const userInfoEl = document.getElementById('user-info');
        const signOutButton = document.getElementById('sign-out-button');

        // Display the user's email if available
        if (identity && identity.email) {
            userInfoEl.textContent = `Signed in as: ${identity.email}`;
        }

        // The sign-out URL is your domain followed by this special path
        const domain = window.location.origin;
        signOutButton.href = `${domain}/cdn-cgi/access/logout`;

    } catch (error) {
        console.error('Could not fetch user identity:', error);
        document.getElementById('user-info').textContent = 'Error loading user.';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Call the new function as soon as the page loads
    setupUserHeader();

    // The rest of your existing code remains the same
    const form = document.getElementById('add-video-form');
    const videoListEl = document.getElementById('video-list');
    const saveButton = document.getElementById('save-changes');
    const statusEl = document.getElementById('status');
    let currentVideos = [];

    const loadVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            if (response.ok) {
                currentVideos = await response.json();
            } else {
                currentVideos = [];
                console.warn('Could not fetch video list, starting fresh.');
            }
            renderVideos();
        } catch (error) {
            console.error('Error loading videos:', error);
            statusEl.textContent = 'Could not load video list.';
        }
    };

    const renderVideos = () => {
        videoListEl.innerHTML = '';
        currentVideos.forEach((video, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${video.title} (ID: ${video.id})</span>`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete';
            deleteButton.onclick = () => {
                currentVideos.splice(index, 1);
                renderVideos();
            };
            li.appendChild(deleteButton);
            videoListEl.appendChild(li);
        });
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('video-title');
        const idInput = document.getElementById('video-id');
        if (titleInput.value && idInput.value) {
            currentVideos.push({ title: titleInput.value, id: idInput.value });
            renderVideos();
            form.reset();
        }
    });

    saveButton.addEventListener('click', async () => {
        statusEl.textContent = 'Saving...';
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with an error:', errorText);
                throw new Error(`Server returned an error. Check console for details.`);
            }

            const result = await response.json();
            if (result.success) {
                statusEl.textContent = 'Changes saved successfully!';
            } else {
                throw new Error(result.error || 'An unknown error occurred.');
            }

        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
            console.error('Full error details:', error);
        }
        
        setTimeout(() => {
            if (statusEl.textContent.startsWith('Changes saved')) {
                 statusEl.textContent = '';
            }
        }, 3000);
    });

    loadVideos();
});
