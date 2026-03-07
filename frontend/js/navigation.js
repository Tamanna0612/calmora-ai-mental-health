/**
 * CALMORA - NAVIGATION MODULE
 * BUG FIX: Removed page.style.display inline styles — only CSS classes used
 */

const Navigation = {

    currentPage: 'home',

    navigateTo(pageName) {

        // Route protection
        if (!Auth.canAccessPage(pageName)) {
            this.showLoginPrompt(pageName);
            return;
        }

        // BUG FIX: Only classList — no inline style.display manipulation
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        const target = document.getElementById(`page-${pageName}`);
        if (target) {
            target.classList.add('active');
            this.currentPage = pageName;
        }

        this.updateNavLinks(pageName);
        window.location.hash = pageName;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show chatbot only on home page
        const chatWidget = document.getElementById('chatbotSection');
        if (chatWidget) {
            if (pageName === 'home') {
                chatWidget.classList.remove('hidden');
            } else {
                chatWidget.classList.add('hidden');
            }
        }

        // Page-specific init
        this.initializePage(pageName);

        // Change body background per page
        this.updateBackground(pageName);
    },

    updateBackground(page) {
        const map = {
            home:          'bg-home',
            about:         'bg-about',
            breathing:     'bg-dark',
            'mood-tracker':'bg-mood',
            'music-therapy':'bg-dark',
            login:         'bg-auth',
            register:      'bg-auth',
            admin:         'bg-home',
        };
        document.body.dataset.bg = map[page] || 'bg-home';
    },

    updateNavLinks(pageName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === pageName);
        });
    },

    initializePage(pageName) {
        switch (pageName) {
            case 'mood-tracker':
                if (typeof MoodTracker !== 'undefined') {
                    MoodTracker.loadMoodData();
                }
                break;
            case 'admin':
                if (typeof AdminDashboard !== 'undefined') {
                    AdminDashboard.loadData();
                }
                break;
        }
    },

    /**
     * Beautiful login prompt modal instead of alert()
     */
    showLoginPrompt(pageName) {
        const existing = document.getElementById('loginPromptModal');
        if (existing) existing.remove();

        const pageLabels = {
            breathing:      '🧘 Breathing Exercise',
            'mood-tracker': '📊 Mood Tracker',
            'music-therapy':'🎵 Music Therapy',
            admin:          '⚙️ Admin Dashboard',
        };
        const label = pageLabels[pageName] || pageName;

        const modal = document.createElement('div');
        modal.id = 'loginPromptModal';
        modal.innerHTML = `
            <div class="lp-overlay">
                <div class="lp-card">
                    <div class="lp-icon">🔒</div>
                    <h3>Sign in Required</h3>
                    <p>Please sign in to access <strong>${label}</strong></p>
                    <div class="lp-btns">
                        <button class="btn btn-primary" id="lpLoginBtn">Sign In</button>
                        <button class="btn btn-outline" id="lpRegisterBtn">Create Account</button>
                    </div>
                    <button class="lp-close" id="lpCloseBtn">✕</button>
                </div>
            </div>
            <style>
                .lp-overlay{position:fixed;inset:0;background:rgba(15,12,41,.55);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;animation:pageIn .25s ease}
                .lp-card{background:#fff;border-radius:24px;padding:44px 40px;text-align:center;max-width:360px;width:90%;box-shadow:0 32px 80px rgba(79,70,229,.3);position:relative;animation:authIn .4s cubic-bezier(.34,1.56,.64,1)}
                .lp-icon{font-size:3rem;margin-bottom:16px;animation:bounce .6s var(--spring)}
                @keyframes bounce{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
                .lp-card h3{font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;margin-bottom:8px}
                .lp-card p{color:#475569;font-size:.9rem;margin-bottom:28px}
                .lp-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
                .lp-close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.05);border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:.9rem;color:#64748b;display:flex;align-items:center;justify-content:center}
                .lp-close:hover{background:rgba(0,0,0,.1)}
            </style>
        `;

        document.body.appendChild(modal);

        document.getElementById('lpLoginBtn').onclick = () => { modal.remove(); this.navigateTo('login'); };
        document.getElementById('lpRegisterBtn').onclick = () => { modal.remove(); this.navigateTo('register'); };
        document.getElementById('lpCloseBtn').onclick = () => modal.remove();
        modal.querySelector('.lp-overlay').onclick = (e) => { if (e.target === modal.querySelector('.lp-overlay')) modal.remove(); };
    },

    init() {
        // Nav link clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.navigateTo(link.getAttribute('data-page'));
            });
        });

        // [data-navigate] buttons anywhere in DOM
        document.addEventListener('click', e => {
            const btn = e.target.closest('[data-navigate]');
            if (btn) {
                e.preventDefault();
                this.navigateTo(btn.getAttribute('data-navigate'));
            }
        });

        // Browser back/forward
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) this.navigateTo(hash);
        });

        // Mobile hamburger
        const hamburger = document.getElementById('mobileMenuToggle');
        const menu = document.getElementById('navbarMenu');
        if (hamburger && menu) {
            hamburger.addEventListener('click', () => {
                menu.classList.toggle('open');
                hamburger.classList.toggle('open');
            });
            // Close on nav link click
            menu.querySelectorAll('.nav-link').forEach(l => {
                l.addEventListener('click', () => {
                    menu.classList.remove('open');
                    hamburger.classList.remove('open');
                });
            });
        }

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
        });

        // Password eye toggles
        const toggleLoginPwd = document.getElementById('toggleLoginPwd');
        if (toggleLoginPwd) {
            toggleLoginPwd.addEventListener('click', () => {
                const inp = document.getElementById('loginPassword');
                inp.type = inp.type === 'password' ? 'text' : 'password';
            });
        }
        const toggleRegPwd = document.getElementById('toggleRegPwd');
        if (toggleRegPwd) {
            toggleRegPwd.addEventListener('click', () => {
                const inp = document.getElementById('registerPassword');
                inp.type = inp.type === 'password' ? 'text' : 'password';
            });
        }

        // Initial page from URL hash
        const initialHash = window.location.hash.replace('#', '');
        this.navigateTo(initialHash || 'home');
    }
};

window.Navigation = Navigation;