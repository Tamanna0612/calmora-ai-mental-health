/**
 * CALMORA - AUTHENTICATION MODULE
 * Handles user authentication, JWT token management, and route guards
 */

const Auth = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.JWT_TOKEN);
        return token !== null && token !== '';
    },

    /**
     * Save JWT token and user data
     */
    saveAuth(token, userData = null) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.JWT_TOKEN, token);
        if (userData) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        }
    },

    /**
     * Clear authentication data
     */
    clearAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CONVERSATION_ID);
    },

    /**
     * Get current user data
     */
    getUserData() {
        const userDataStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        return userDataStr ? JSON.parse(userDataStr) : null;
    },

    /**
     * Update UI based on authentication state
     */
    updateUI() {
        const btnLogin = document.getElementById('btnLogin');
        const userAvatar = document.getElementById('userAvatar');
        const userInitials = document.getElementById('userInitials');

        if (this.isAuthenticated()) {
            btnLogin.classList.add('hidden');
            userAvatar.classList.remove('hidden');

            const userData = this.getUserData();
            if (userData && userData.username) {
                userInitials.textContent = userData.username.charAt(0).toUpperCase();
            }
        } else {
            btnLogin.classList.remove('hidden');
            userAvatar.classList.add('hidden');
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin(email, password) {
        try {
            const response = await API.auth.login(email, password);

            if (response.access_token) {
                this.saveAuth(response.access_token, { email });
                this.updateUI();
                return { success: true };
            }

            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    /**
     * Handle registration form submission
     */
    async handleRegister(username, email, password) {
        try {
            const response = await API.auth.register(username, email, password);

            if (response.access_token) {
                this.saveAuth(response.access_token, { username, email });
                this.updateUI();
                return { success: true };
            }

            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    /**
     * Handle logout
     */
    handleLogout() {
        this.clearAuth();
        this.updateUI();
        Navigation.navigateTo('home');
    },

    /**
     * Check route access (JWT protection)
     */
    canAccessPage(pageName) {
        // BUG FIX: Added breathing, mood-tracker, music-therapy to protected pages.
        // Previously only 'admin' was protected, so unauthenticated users could
        // navigate directly to these pages via URL hash.
        const protectedPages = ['admin', 'breathing', 'mood-tracker', 'music-therapy'];

        if (protectedPages.includes(pageName)) {
            return this.isAuthenticated();
        }

        return true;
    },

    /**
     * Initialize authentication system
     */
    init() {
        this.updateUI();

        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const errorDiv = document.getElementById('loginError');

                const result = await this.handleLogin(email, password);

                if (result.success) {
                    Navigation.navigateTo('home');
                } else {
                    errorDiv.textContent = result.error;
                    errorDiv.classList.remove('hidden');
                }
            });
        }

        // Register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = document.getElementById('registerUsername').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const errorDiv = document.getElementById('registerError');

                const result = await this.handleRegister(username, email, password);

                if (result.success) {
                    Navigation.navigateTo('home');
                } else {
                    errorDiv.textContent = result.error;
                    errorDiv.classList.remove('hidden');
                }
            });
        }

        // Logout button handler
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Login button handler
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                Navigation.navigateTo('login');
            });
        }

        // Show register link
        const showRegisterLink = document.getElementById('showRegisterLink');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                Navigation.navigateTo('register');
            });
        }

        // Show login link
        const showLoginLink = document.getElementById('showLoginLink');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                Navigation.navigateTo('login');
            });
        }
    }
};