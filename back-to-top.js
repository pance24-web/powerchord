// UX-001: Back to Top Button
function initBackToTop() {
    const button = document.createElement('button');
    button.id = 'backToTop';
    button.className = 'back-to-top';
    button.innerHTML = '↑ Atas';
    button.setAttribute('aria-label', 'Kembali ke atas halaman');
    button.hidden = true;
    
    document.body.appendChild(button);
    
    const toggleButton = () => {
        button.hidden = window.scrollY <= 300;
    };
    
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', toggleButton, { passive: true });
    toggleButton(); // Cek posisi awal
}

// Panggil saat DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackToTop);
} else {
    initBackToTop();
}