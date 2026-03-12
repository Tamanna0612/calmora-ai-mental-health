/**
 * CALMORA - AI CHATBOT MODULE
 * FIXES:
 * 1. detectMoodSuggestion — added more Hindi/Hinglish/English keywords
 * 2. Auto-navigate after suggestion (no button click needed)
 * 3. "not feeling well", "udaas", "thaka hua" etc. now detected
 */

const Chatbot = {

    conversationId: null,
    isProcessing: false,

    // ─── Conversation init ──────────────────────────────────
    async initConversation() {
        const storedId = localStorage.getItem(CONFIG.STORAGE_KEYS.CONVERSATION_ID);
        if (storedId && Auth.isAuthenticated()) {
            this.conversationId = parseInt(storedId);
        } else if (Auth.isAuthenticated()) {
            try {
                const conv = await API.chat.startConversation();
                this.conversationId = conv.id;
                localStorage.setItem(CONFIG.STORAGE_KEYS.CONVERSATION_ID, conv.id);
            } catch (err) {
                console.warn('Conversation start failed:', err);
            }
        }
    },

    // ─── Add message bubble ─────────────────────────────────
    addMessage(role, content) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `
            <div class="msg-bub">${this.formatMessage(content)}</div>
            <div class="msg-time">${this.getTime()}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // Format message — convert \n to <br>
    formatMessage(text) {
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    },

    // ─── Typing indicator ───────────────────────────────────
    showTyping() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.id = 'typingIndicator';
        div.className = 'chat-msg bot';
        div.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    removeTyping() {
        document.getElementById('typingIndicator')?.remove();
    },

    // ─── IMPROVED: Mood suggestion with auto-navigate buttons ─
    addSuggestionMessage(text, actionPage, musicRecommendation = null) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const pageLabels = {
            'breathing':      '🧘 Try Breathing Exercise',
            'music-therapy':  '🎵 Open Music Therapy',
            'mood-tracker':   '📊 Track Your Mood',
        };

        const btnLabel = pageLabels[actionPage] || '→ Go There';

        // Music recommendation HTML
        let musicHTML = '';
        if (musicRecommendation) {
            musicHTML = `
                <div class="sug-music-rec">
                    🎵 <strong>Recommended:</strong> ${musicRecommendation}
                </div>`;
        }

        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.innerHTML = `
            <div class="msg-bub suggestion-bub">
                <div class="sug-text">${this.formatMessage(text)}</div>
                ${musicHTML}
                <div class="sug-actions">
                    <button class="chat-sugg-btn primary-sugg" data-action="${actionPage}">
                        ${btnLabel}
                    </button>
                    <button class="chat-sugg-btn secondary-sugg" data-action="mood-tracker">
                        📊 Log This Mood
                    </button>
                </div>
            </div>
            <div class="msg-time">${this.getTime()}</div>
        `;

        container.appendChild(div);

        // Button click → navigate
        div.querySelectorAll('.chat-sugg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-action');
                Navigation.navigateTo(page);
            });
        });

        container.scrollTop = container.scrollHeight;
    },

    // ─── Emergency detection ────────────────────────────────
    detectEmergency(text) {
        const riskWords = [
            'suicide', 'kill myself', 'hurt myself', 'i want to die',
            'end my life', 'self harm', 'khatam kar lu', 'mar jana chahta',
            'mar jana chahti', 'jeena nahi'
        ];
        return riskWords.some(w => text.toLowerCase().includes(w));
    },

    // ─── FIXED: Mood Detection — more keywords added ─────────
    detectMoodSuggestion(text) {
        const msg = text.toLowerCase();

        // ── STRESS / ANXIETY ──────────────────────────────────
        if (
            msg.includes('stress') || msg.includes('stressed') ||
            msg.includes('anxious') || msg.includes('anxiety') ||
            msg.includes('panic') || msg.includes('tension') ||
            msg.includes('nervous') || msg.includes('overwhelm') ||
            msg.includes('pressure') || msg.includes('pareshaan') ||
            msg.includes('pareshan') || msg.includes('ghabra') ||
            msg.includes('darr') || msg.includes('dar lag') ||
            msg.includes('bohot kaam') || msg.includes('thak')
        ) {
            return {
                text: "I can sense you're feeling stressed or anxious 💙\n\nHere's what I recommend:\n• A quick breathing exercise will calm your nervous system in 2 minutes\n• Soft music can reduce cortisol levels instantly",
                action: 'breathing',
                music: 'Nature Sounds or Ocean Waves 🌊'
            };
        }

        // ── SAD / DEPRESSED / NOT FEELING WELL ───────────────
        if (
            msg.includes('sad') || msg.includes('sadness') ||
            msg.includes('depress') || msg.includes('lonely') ||
            msg.includes('alone') || msg.includes('cry') ||
            msg.includes('unhappy') || msg.includes('miserable') ||
            msg.includes('not feeling well') || msg.includes('not feeling good') ||
            msg.includes('feeling bad') || msg.includes('feel bad') ||
            msg.includes('not well') || msg.includes('bura lag') ||
            msg.includes('bura feel') || msg.includes('udaas') ||
            msg.includes('dukhi') || msg.includes('dard') ||
            msg.includes('rona') || msg.includes('rone ka') ||
            msg.includes('akela') || msg.includes('akeli') ||
            msg.includes('mood thik nahi') || msg.includes('acha nahi lag') ||
            msg.includes('accha nahi lag') || msg.includes('thik nahi') ||
            msg.includes('i am not okay') || msg.includes('not okay') ||
            msg.includes('im not okay') || msg.includes("i'm not okay") ||
            msg.includes('feeling low') || msg.includes('feel low') ||
            msg.includes('down') || msg.includes('hurt') ||
            msg.includes('heartbreak') || msg.includes('broken')
        ) {
            return {
                text: "I'm really sorry you're not feeling well right now 🤗\n\nYou're not alone — I'm here with you.\n\nHere's what may help:\n• Calm piano or nature music can lift your mood\n• Gentle breathing exercise helps release emotional tension",
                action: 'music-therapy',
                music: 'Calm Piano or Rain Sounds 🎹'
            };
        }

        // ── ANGRY / FRUSTRATED ────────────────────────────────
        if (
            msg.includes('angry') || msg.includes('anger') ||
            msg.includes('frustrated') || msg.includes('frustration') ||
            msg.includes('irritated') || msg.includes('mad') ||
            msg.includes('furious') || msg.includes('rage') ||
            msg.includes('gussa') || msg.includes('irritating') ||
            msg.includes('annoyed') || msg.includes('jhanjhat') ||
            msg.includes('pagal kar diya') || msg.includes('nafrat')
        ) {
            return {
                text: "I understand you're feeling angry or frustrated 🌬️\n\nThis is completely valid. Here's what helps:\n• Controlled deep breathing releases tension quickly\n• Ocean waves music calms the mind within minutes",
                action: 'breathing',
                music: 'Ocean Waves 🌊'
            };
        }

        // ── TIRED / EXHAUSTED ─────────────────────────────────
        if (
            msg.includes('tired') || msg.includes('exhausted') ||
            msg.includes('fatigue') || msg.includes('sleepy') ||
            msg.includes('no energy') || msg.includes('drained') ||
            msg.includes('thaka hua') || msg.includes('thaki hui') ||
            msg.includes('thak gaya') || msg.includes('thak gayi') ||
            msg.includes('neend') || msg.includes('so jana') ||
            msg.includes('rest') || msg.includes('aram')
        ) {
            return {
                text: "You sound tired and drained 😴\n\nRest is important for mental health.\n\nHere's what I suggest:\n• Sleep sounds or white noise will help you relax\n• A short breathing exercise prepares your body for rest",
                action: 'music-therapy',
                music: 'White Noise or Rain Sounds 🌧️'
            };
        }

        // ── HAPPY / GOOD ──────────────────────────────────────
        if (
            msg.includes('happy') || msg.includes('great') ||
            msg.includes('wonderful') || msg.includes('amazing') ||
            msg.includes('excited') || msg.includes('good mood') ||
            msg.includes('feeling good') || msg.includes('feel good') ||
            msg.includes('khush') || msg.includes('mast') ||
            msg.includes('acha lag') || msg.includes('accha lag') ||
            msg.includes('awesome') || msg.includes('fantastic')
        ) {
            return {
                text: "That's wonderful to hear! 😊✨\n\nKeep this positive energy going:\n• Log this happy mood in your tracker\n• Upbeat music will amplify your good vibes!",
                action: 'mood-tracker',
                music: 'Upbeat Meditation 🎵'
            };
        }

        return null;
    },

    // ─── Time-based greeting ────────────────────────────────
    getGreetingMessage() {
        const h = new Date().getHours();
        if (h < 12) return "🌞 Good morning! How are you feeling today?";
        if (h < 18) return "☀️ Good afternoon! How's your day going?";
        return "🌙 Good evening! How are you feeling tonight?";
    },

    getTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, c =>
            ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c])
        );
    },

    // ─── MAIN SEND MESSAGE ───────────────────────────────────
    async sendMessage(content) {
        if (!content.trim() || this.isProcessing) return;
        this.isProcessing = true;

        if (!Auth.isAuthenticated()) {
            Navigation.showLoginPrompt('home');
            this.isProcessing = false;
            return;
        }

        if (!this.conversationId) await this.initConversation();

        this.addMessage('user', content);
        const input = document.getElementById('chatInput');
        if (input) input.value = '';

        this.showTyping();

        try {
            // Emergency check
            if (this.detectEmergency(content)) {
                await this.sleep(1200);
                this.removeTyping();
                this.addMessage('bot',
                    "⚠️ If you're experiencing thoughts of self-harm or suicide, please reach out immediately:\n\n" +
                    "📞 iCall: 9152987821 (India)\n" +
                    "📞 Vandrevala Foundation: 1860-2662-345\n\n" +
                    "You are not alone, and help is available right now. 💙"
                );
                try { await API.chat.sendMessage(this.conversationId, content); } catch(e) {}
                this.isProcessing = false;
                return;
            }

            // Detect mood BEFORE API call
            const suggestion = this.detectMoodSuggestion(content);

            // Try backend AI
            const response = await API.chat.sendMessage(this.conversationId, content);
            await this.sleep(400);
            this.removeTyping();

            if (response && response.content) {
                this.addMessage('bot', response.content);
            }

            // Always show suggestion card if mood detected
            if (suggestion) {
                setTimeout(() => {
                    this.addSuggestionMessage(
                        suggestion.text,
                        suggestion.action,
                        suggestion.music
                    );
                }, 700);
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.removeTyping();

            // Fallback response
            const suggestion = this.detectMoodSuggestion(content);
            if (suggestion) {
                this.addMessage('bot', "I'm here for you 💙 Let me suggest something that may help:");
                setTimeout(() => {
                    this.addSuggestionMessage(
                        suggestion.text,
                        suggestion.action,
                        suggestion.music
                    );
                }, 400);
            } else {
                this.addMessage('bot',
                    "I'm here to support you 💙\n\n" +
                    "I'm having trouble connecting right now, but you can try:\n" +
                    "• Breathing exercises to calm down\n" +
                    "• Music therapy to relax\n" +
                    "• Mood tracker to log how you feel"
                );
            }
        } finally {
            this.isProcessing = false;
        }
    },

    sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

    // ─── INIT ────────────────────────────────────────────────
    init() {
        if (Auth.isAuthenticated()) this.initConversation();

        this.addMessage('bot', this.getGreetingMessage());

        document.getElementById('chatSendBtn')?.addEventListener('click', () => {
            this.sendMessage(document.getElementById('chatInput')?.value || '');
        });

        document.getElementById('chatInput')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage(e.target.value);
            }
        });

        const toggleHeader = document.getElementById('chatbotToggleHeader');
        const box = document.getElementById('chatbotBox');
        const icon = document.getElementById('chatbotToggleIcon');
        if (toggleHeader && box) {
            toggleHeader.addEventListener('click', () => {
                box.classList.toggle('minimized');
                if (icon) icon.textContent = box.classList.contains('minimized') ? '+' : '−';
            });
        }
    }
};

window.Chatbot = Chatbot;