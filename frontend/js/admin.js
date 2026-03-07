/**
 * CALMORA - ADMIN DASHBOARD MODULE
 * JWT-protected admin panel with analytics and insights
 */

const AdminDashboard = {
    chartInstance: null,

    /**
     * Load dashboard data
     */
    async loadData() {
        if (!Auth.isAuthenticated()) {
            Navigation.navigateTo('login');
            return;
        }

        try {
            // Load mood summary
            await this.loadMoodStats();

            // Load conversations (if user has any)
            await this.loadChatLogs();

            // Render admin mood chart
            this.renderMoodChart();

        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    },

    /**
     * Load mood statistics
     */
    async loadMoodStats() {
        try {
            const summary = await API.mood.getSummary();

            // Update stat cards
            document.getElementById('statMoods').textContent = summary.total_entries || 0;

            // Note: User and conversation counts would require additional API endpoints
            // For now, using placeholder values
            document.getElementById('statUsers').textContent = '1';
            document.getElementById('statConversations').textContent = '0';
            document.getElementById('statRisks').textContent = '0';

        } catch (error) {
            console.error('Error loading mood stats:', error);
        }
    },

    /**
     * Load chat logs
     */
    async loadChatLogs() {
        const chatLogsTable = document.getElementById('chatLogsTable');

        try {
            const conversations = await API.chat.listConversations();

            if (!conversations || conversations.length === 0) {
                chatLogsTable.innerHTML = '<tr><td colspan="6" class="table-empty">No chat logs available</td></tr>';
                return;
            }

            // Update conversation count
            document.getElementById('statConversations').textContent = conversations.length;

            // Display recent messages from conversations
            const recentMessages = [];

            for (const conv of conversations.slice(0, 5)) {
                try {
                    const fullConv = await API.chat.getConversation(conv.id);
                    if (fullConv.messages && fullConv.messages.length > 0) {
                        fullConv.messages.forEach(msg => {
                            recentMessages.push({
                                user: 'Current User',
                                message: msg.content,
                                mood: msg.mood || 'N/A',
                                sentiment: msg.sentiment_score ? msg.sentiment_score.toFixed(2) : 'N/A',
                                risk: msg.risk_detected ? 'Yes' : 'No',
                                timestamp: msg.timestamp
                            });
                        });
                    }
                } catch (err) {
                    console.error('Error loading conversation:', err);
                }
            }

            // Sort by timestamp and take recent 10
            recentMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const displayMessages = recentMessages.slice(0, 10);

            if (displayMessages.length === 0) {
                chatLogsTable.innerHTML = '<tr><td colspan="6" class="table-empty">No messages available</td></tr>';
                return;
            }

            // Render table rows
            chatLogsTable.innerHTML = displayMessages.map(msg => `
                <tr>
                    <td>${this.escapeHtml(msg.user)}</td>
                    <td>${this.truncateText(this.escapeHtml(msg.message), 50)}</td>
                    <td>${this.escapeHtml(msg.mood)}</td>
                    <td>${msg.sentiment}</td>
                    <td>${msg.risk}</td>
                    <td>${this.formatTime(msg.timestamp)}</td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading chat logs:', error);
            chatLogsTable.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading chat logs</td></tr>';
        }
    },

    /**
     * Render mood distribution chart
     */
    async renderMoodChart() {
        const ctx = document.getElementById('adminMoodChart');
        if (!ctx) return;

        try {
            const summary = await API.mood.getSummary();
            const moodDistribution = summary.mood_distribution || {};

            const labels = Object.keys(moodDistribution);
            const data = Object.values(moodDistribution);
            const backgroundColors = labels.map(mood => CONFIG.CHART_COLORS[mood] || '#6b7280');

            // Destroy existing chart
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            // Create new chart
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: 'Overall Mood Distribution',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering mood chart:', error);
        }
    },

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    },

    /**
     * Truncate text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Initialize admin dashboard
     */
    init() {
        // Dashboard will be loaded when navigating to admin page
        // See Navigation.initializePage()
    }
};