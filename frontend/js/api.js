/**
 * CALMORA - API SERVICE
 * Handles all HTTP requests to the backend with JWT authentication
 */

const API = {
    /**
     * Get authentication headers with JWT token
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = localStorage.getItem(CONFIG.STORAGE_KEYS.JWT_TOKEN);
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    },

    /**
     * Build full API URL
     */
    buildUrl(endpoint, params = {}) {
        let url = CONFIG.API_BASE_URL + endpoint;

        // Replace URL parameters (e.g., :id)
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });

        return url;
    },

    /**
     * Generic HTTP request handler
     */
    async request(method, endpoint, data = null, params = {}, includeAuth = true) {
        try {
            const url = this.buildUrl(endpoint, params);
            const options = {
                method,
                headers: this.getHeaders(includeAuth)
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.detail || 'Request failed');
            }

            return responseData;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    /**
     * Authentication APIs
     */
    auth: {
        async login(email, password) {
            return await API.request('POST', CONFIG.ENDPOINTS.AUTH_LOGIN, 
                { email, password }, {}, false);
        },

        async register(username, email, password) {
            return await API.request('POST', CONFIG.ENDPOINTS.AUTH_REGISTER, 
                { username, email, password }, {}, false);
        }
    },

    /**
     * Chat APIs
     */
    chat: {
        async startConversation() {
            return await API.request('POST', CONFIG.ENDPOINTS.CHAT_START);
        },

        async sendMessage(conversationId, content) {
            return await API.request('POST', CONFIG.ENDPOINTS.CHAT_MESSAGE, 
                { content }, { id: conversationId });
        },

        async getConversation(conversationId) {
            return await API.request('GET', CONFIG.ENDPOINTS.CHAT_GET, 
                null, { id: conversationId });
        },

        async listConversations() {
            return await API.request('GET', CONFIG.ENDPOINTS.CHAT_LIST);
        }
    },

    /**
     * Mood APIs
     */
    mood: {
        async addMood(mood, note = '') {
            return await API.request('POST', CONFIG.ENDPOINTS.MOOD_ADD, 
                { mood, note });
        },

        async listMoods() {
            return await API.request('GET', CONFIG.ENDPOINTS.MOOD_LIST);
        },

        async getSummary() {
            return await API.request('GET', CONFIG.ENDPOINTS.MOOD_SUMMARY);
        },

        async deleteMood(moodId) {
            return await API.request('DELETE', CONFIG.ENDPOINTS.MOOD_DELETE, 
                null, { id: moodId });
        }
    },

    /**
     * Health Check
     */
    async healthCheck() {
        try {
            const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.HEALTH);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'Unavailable' };
        }
    }
};