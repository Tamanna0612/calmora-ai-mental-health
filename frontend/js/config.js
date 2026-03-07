
const CONFIG = {
    // Backend API Configuration
    API_BASE_URL: 'http://localhost:8000',
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login',
        AUTH_REGISTER: '/auth/register',
        
        // Chat
        CHAT_START: '/chat/start',
        CHAT_MESSAGE: '/chat/:id/message',
        CHAT_GET: '/chat/:id',
        CHAT_LIST: '/chat/',
        
        // Mood Tracking
        MOOD_ADD: '/mood/add',
        MOOD_LIST: '/mood/',
        MOOD_SUMMARY: '/mood/summary',
        MOOD_DELETE: '/mood/:id',
        
        // Health Check
        HEALTH: '/health'
    },
    
    // LocalStorage Keys
    STORAGE_KEYS: {
        JWT_TOKEN: 'calmora_jwt_token',
        USER_DATA: 'calmora_user_data',
        CONVERSATION_ID: 'calmora_conversation_id',
        MOOD_DATA: 'calmora_mood_data'
    },
    
    // Animation Timings (milliseconds)
    TIMINGS: {
        PAGE_TRANSITION: 300,
        CHAT_RESPONSE_DELAY: 500,
        BREATHING_INHALE: 4000,
        BREATHING_HOLD: 4000,
        BREATHING_EXHALE: 6000
    },
    
    // Mood Options
    MOODS: [
        { value: 'happy', emoji: '😊', label: 'Happy' },
        { value: 'calm', emoji: '😌', label: 'Calm' },
        { value: 'anxious', emoji: '😰', label: 'Anxious' },
        { value: 'sad', emoji: '😢', label: 'Sad' },
        { value: 'angry', emoji: '😠', label: 'Angry' },
        { value: 'neutral', emoji: '😐', label: 'Neutral' }
    ],
    
    // Chart Colors (for mood analytics)
    CHART_COLORS: {
        happy: '#10b981',
        calm: '#06b6d4',
        anxious: '#f59e0b',
        sad: '#3b82f6',
        angry: '#ef4444',
        neutral: '#6b7280'
    }
};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);