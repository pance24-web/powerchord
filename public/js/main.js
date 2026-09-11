
// P0 FIX: Initialize genre filter buttons on page load
function initGenreFilter() {
    updateFilterButtonState('[data-genre]', state.activeGenre, 'genre');
    
    document.querySelectorAll('[data-genre]').forEach((button) => {
        button.addEventListener('click', () => {
            const genre = button.dataset.genre || 'All';
            
            const isCatalogPage = window.location.pathname.endsWith('/catalog')
                || window.location.pathname.includes('catalog.html');
            if (isCatalogPage) {
                const newUrl = new URL(window.location.href);
                if (genre === 'All') {
                    newUrl.searchParams.delete('genre');
                } else {
                    newUrl.searchParams.set('genre', genre);
                }
                window.location.href = newUrl;
            } else {
                state.activeGenre = genre;
                updateFilterButtonState('[data-genre]', state.activeGenre, 'genre');
                filterHomepage();
            }
        });
    });
}

successfully downloaded text file (SHA: 674b8d17ad328039653920b5b905313e0f0b3f26)