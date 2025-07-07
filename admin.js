document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-video-form');
    const videoListEl = document.getElementById('video-list');
    const saveButton = document.getElementById('save-changes');
    const statusEl = document.getElementById('status');
    let currentVideos = [];

    // Fetches the initial list of videos from the server
    const loadVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            // If no videos exist yet, API returns 404, which is fine.
            if (response.ok) {
                currentVideos = await response.json();
            } else {
                currentVideos = [];
            }
            renderVideos();
        } catch (error) {
            console.error('Error loading videos:', error);
            statusEl.textContent = 'Could not load video list.';
        }
    };

    // Renders the current list of videos in the admin panel
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

    // Handles the "Add Video" form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('video-title');
        const idInput = document.getElementById('video-id');
        currentVideos.push({ title: titleInput.value, id: idInput.value });
        renderVideos();
        form.reset();
    });

    // Handles the "Save All Changes" button click
    saveButton.addEventListener('click', async () => {
        statusEl.textContent = 'Saving...';
        try {
            const response = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVideos)
            });
            const result = await response.json();
            if (response.ok) {
                statusEl.textContent = 'Changes saved successfully!';
            } else {
                throw new Error(result.error || 'Failed to save.');
            }
        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
        }
        setTimeout(() => statusEl.textContent = '', 3000);
    });

    // Initial load
    loadVideos();
});
