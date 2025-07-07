// This new function handles fetching the user identity and setting up the header
const setupUserHeader = async () => {
    try {
        // Cloudflare Access provides this special endpoint to get user identity
        const response = await fetch('/cdn-cgi/access/get-identity');
        if (!response.ok) {
            // This can happen if the user is not logged in, fail silently.
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

document.addEventListener('DOMContentLoaded', async () => {
    // Call the new function as soon as the page loads
    setupUserHeader();

    // The rest of your existing code remains the same
    const gallery = document.getElementById('video-gallery');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/videos');
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const videos = await response.json();

        loading.style.display = 'none';

        if (videos && videos.length > 0) {
            videos.forEach(video => {
                const container = document.createElement('div');
                container.className = 'video-container';

                const title = document.createElement('h3');
                title.textContent = video.title;

                const embed = document.createElement('div');
                embed.className = 'video-embed';
                embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

                container.appendChild(title);
                container.appendChild(embed);
                gallery.appendChild(container);
            });
        } else {
            gallery.innerHTML = '<p>No videos are available at this time.</p>';
        }
    } catch (error) {
        loading.textContent = 'Failed to load videos. Please try again later.';
        console.error('Error fetching videos:', error);
    }
});
