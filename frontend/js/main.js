/**
 * CALMORA - MAIN APPLICATION
 * ★ All 5 improvements initialised here
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🧘 Calmora — Mental Health Web Application');
    initApp();
});

async function initApp() {
    try {
        if (typeof Auth       !== 'undefined') { Auth.init();       console.log('✓ Auth'); }
        if (typeof Navigation !== 'undefined') { Navigation.init(); console.log('✓ Navigation'); }
        if (typeof Chatbot    !== 'undefined') { Chatbot.init();    console.log('✓ Chatbot (AI)'); }
        if (typeof BreathingExercise !== 'undefined') { BreathingExercise.init(); console.log('✓ Breathing'); }
        if (typeof MoodTracker!== 'undefined') { MoodTracker.init();console.log('✓ Mood Tracker'); }
        if (typeof MusicTherapy !== 'undefined') { MusicTherapy.init(); console.log('✓ Music'); }
        if (typeof AdminDashboard !== 'undefined') { AdminDashboard.init(); console.log('✓ Admin'); }

        // ★ Dark Mode (Improvement #4)
        initTheme();

        // ★ Scroll reveal animations for cards
        initScrollReveal();

        // Show welcome if logged in
        showWelcomeMessage();

        // Backend health check
        await checkBackend();

        console.log('✅ Calmora ready!');

    } catch (err) {
        console.error('App init error:', err);
    }
}

// ─── Dark Mode (Improvement #4) ─────────────────────────────
function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    // Restore saved theme
    if (localStorage.getItem('calmora_theme') === 'dark') {
        document.body.classList.add('dark');
    }

    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('calmora_theme', isDark ? 'dark' : 'light');
    });
}

// ─── Scroll Reveal ───────────────────────────────────────────
function initScrollReveal() {
    // Observe all reveal targets
    const targets = document.querySelectorAll(
        '.scroll-reveal, .feat-card, .about-card, .r-stat, .r-card, .music-card, .a-card, .ai-banner'
    );

    if (!targets.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    targets.forEach((el, i) => {
        // Staggered delay
        el.style.transitionDelay = `${(i % 6) * 0.08}s`;
        observer.observe(el);
    });
}

// ─── Welcome message ────────────────────────────────────────
function showWelcomeMessage() {
    const user = Auth?.getUserData?.();
    if (!user) return;

    const name = user.username || user.email?.split('@')[0] || 'User';

    // Update dropdown name
    const dropName = document.getElementById('dropdownUserName');
    const dropEmail = document.getElementById('dropdownUserEmail');
    if (dropName) dropName.textContent = name;
    if (dropEmail) dropEmail.textContent = user.email || '';
}

// ─── Backend health check ────────────────────────────────────
async function checkBackend() {
    try {
        if (!window.API?.healthCheck) return;
        const health = await API.healthCheck();
        if (health?.status) console.log('Backend:', health.status);
    } catch {
        console.warn('⚠️ Backend not reachable — some features limited.');
        showBanner('Cannot connect to backend server. Some features may not work.', 'warning');
    }
}

// ─── Banner notification ─────────────────────────────────────
function showBanner(message, type = 'info') {
    const banner = document.createElement('div');
    banner.style.cssText = `
        position:fixed; top:80px; left:50%; transform:translateX(-50%);
        background:${type === 'warning' ? '#fef3c7' : '#e0e7ff'};
        color:${type === 'warning' ? '#92400e' : '#3730a3'};
        border:1px solid ${type === 'warning' ? '#fcd34d' : '#c7d2fe'};
        padding:10px 22px; border-radius:12px; font-size:.86rem; font-weight:600;
        box-shadow:0 4px 20px rgba(0,0,0,.1); z-index:5000; font-family:'DM Sans',sans-serif;
        animation:pageIn .3s ease;
    `;
    banner.textContent = message;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 6000);
}

// Global error handling
window.addEventListener('error', e => console.error('Global error:', e.error));
window.addEventListener('unhandledrejection', e => console.error('Unhandled promise:', e.reason));