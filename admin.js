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
            if (response.ok) {
                currentVideos = await response.json();
            } else {
                // If the initial load fails, assume an empty list
                currentVideos = [];
                console.warn('Could not fetch video list, starting fresh.');
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
        if (titleInput.value && idInput.value) {
            currentVideos.push({ title: titleInput.value, id: idInput.value });
            renderVideos();
            form.reset();
        }
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

            // *** NEW DEBUGGING LOGIC IS HERE ***
            // Check if the server response is successful
            if (!response.ok) {
                // If not, get the response as plain text to see what it is
                const errorText = await response.text();
                // Log the problematic text to the developer console
                console.error('Server responded with an error:', errorText);
                // Throw an error with the server's actual response
                throw new Error(`Server returned an error. Check console for details.`);
            }

            // If the response was ok, parse it as JSON
            const result = await response.json();
            if (result.success) {
                statusEl.textContent = 'Changes saved successfully!';
            } else {
                throw new Error(result.error || 'An unknown error occurred.');
            }

        } catch (error) {
            // Display the new, more informative error message
            statusEl.textContent = `Error: ${error.message}`;
            console.error('Full error details:', error);
        }
        
        // Clear the status message after a few seconds
        setTimeout(() => {
            if (statusEl.textContent.startsWith('Changes saved')) {
                 statusEl.textContent = '';
            }
        }, 3000);
    });

    // Initial load
    loadVideos();
});
