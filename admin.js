// This function handles fetching the user identity and setting up the header
const setupUserHeader = async () => {
    try {
        // We use 'get-session' which is proven to work from our tests
        const response = await fetch('/cdn-cgi/access/get-session');
        if (!response.ok) {
            document.getElementById('user-info').textContent = 'Not signed in.';
            return;
        }

        const session = await response.json();
        const userInfoEl = document.getElementById('user-info');
        const signOutButton = document.getElementById('sign-out-button');

        // Display the user's email if it exists in the session
        if (session && session.email) {
            userInfoEl.textContent = `Signed in as: ${session.email}`;
        } else {
            // If the email isn't in the session, show a generic message
            document.getElementById('user-info').textContent = 'Signed in';
        }

        // The sign-out URL is your domain followed by this special path
        const domain = window.location.origin;
        signOutButton.href = `${domain}/cdn-cgi/access/logout`;

    } catch (error) {
        console.error('Could not fetch user session:', error);
        document.getElementById('user-info').textContent = 'Error loading user.';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Run the header setup function when the page loads
    setupUserHeader();

    // The rest of the code for managing videos
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
            currentVideos.push({ title: titleInput.value
