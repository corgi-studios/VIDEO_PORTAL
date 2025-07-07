document.addEventListener('DOMContentLoaded', async () => {
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
