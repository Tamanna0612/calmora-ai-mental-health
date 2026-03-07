/**
 * CALMORA - MOOD TRACKER MODULE
 * ★ Improvement #2: Full Analytics Dashboard
 *   - Weekly mood bar chart
 *   - Mood distribution donut
 *   - Stress pattern line chart
 *   - Usage statistics (total, top mood, streak)
 *   - AI insight text
 * BUG FIX: alert() replaced with toast notifications
 */

const MoodTracker = {

    selectedMood: null,
    moodChart:    null,
    donutChart:   null,
    stressChart:  null,
    moodData:     [],

    // ─── Select Mood ────────────────────────────────────────
    selectMood(value) {
        this.selectedMood = value;
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.getAttribute('data-mood') === value);
        });
    },

    // ─── Save Mood ──────────────────────────────────────────
    async saveMood() {
        if (!this.selectedMood) {
            this.showToast('Please select a mood first 😊', 'error');
            return;
        }

        const note = document.getElementById('moodNote')?.value || '';

        try {
            // BUG FIX: always uses backend (mood-tracker is protected page)
            await API.mood.addMood(this.selectedMood, note);
            await this.loadMoodData();

            // Reset form
            this.selectedMood = null;
            if (document.getElementById('moodNote')) document.getElementById('moodNote').value = '';
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));

            // BUG FIX: toast instead of alert()
            this.showToast('✅ Mood saved successfully!');

        } catch (err) {
            console.error('Save mood error:', err);
            this.showToast('❌ Failed to save mood. Please try again.', 'error');
        }
    },

    // ─── Load Mood Data ──────────────────────────────────────
    async loadMoodData() {
        try {
            const data = Auth.isAuthenticated()
                ? await API.mood.listMoods()
                : JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MOOD_DATA) || '[]');

            this.moodData = data || [];
        } catch (err) {
            console.error('Load mood error:', err);
            this.moodData = [];
        }

        this.renderAll();
    },

    // ─── Render Everything ──────────────────────────────────
    renderAll() {
        this.renderEntries();
        this.renderWeeklyChart();
        this.renderDonutChart();
        this.renderStressChart();
        this.renderStats();
        this.renderInsight();
    },

    // ─── Mood Entries List ──────────────────────────────────
    renderEntries() {
        const container = document.getElementById('moodEntries');
        if (!container) return;

        if (!this.moodData.length) {
            container.innerHTML = '<p class="empty-msg">No entries yet. Start tracking your mood above!</p>';
            return;
        }

        const sorted = [...this.moodData].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = sorted.slice(0,10).map(entry => {
            const cfg = CONFIG.MOODS.find(m => m.value === entry.mood);
            return `
                <div class="mood-entry">
                    <span class="mood-entry-emoji">${cfg?.emoji || '😐'}</span>
                    <div class="mood-entry-info">
                        <div class="mood-entry-mood">${cfg?.label || entry.mood}</div>
                        ${entry.note ? `<div class="mood-entry-note">${this.escapeHtml(entry.note)}</div>` : ''}
                    </div>
                    <span class="mood-entry-time">${this.relativeTime(entry.timestamp)}</span>
                </div>`;
        }).join('');
    },

    // ─── ★ Weekly Bar Chart ──────────────────────────────────
    renderWeeklyChart() {
        const ctx = document.getElementById('moodChart');
        if (!ctx) return;
        if (this.moodChart) this.moodChart.destroy();

        // Last 7 days labels
        const labels = [];
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            labels.push(days[d.getDay()]);
        }

        // Count positive vs negative per day
        const posData = new Array(7).fill(0);
        const negData = new Array(7).fill(0);
        const positiveMoods = ['happy','calm'];

        this.moodData.forEach(entry => {
            const d = new Date(entry.timestamp);
            const diff = Math.floor((Date.now() - d) / 86400000);
            if (diff < 7) {
                const idx = 6 - diff;
                if (positiveMoods.includes(entry.mood)) posData[idx]++;
                else negData[idx]++;
            }
        });

        this.moodChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Positive',
                        data: posData,
                        backgroundColor: 'rgba(99,102,241,0.75)',
                        borderRadius: 6,
                        borderSkipped: false,
                    },
                    {
                        label: 'Negative',
                        data: negData,
                        backgroundColor: 'rgba(251,191,36,0.7)',
                        borderRadius: 6,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Outfit', size: 11 }, boxWidth: 10 } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(0,0,0,.06)' } }
                }
            }
        });
    },

    // ─── ★ Distribution Donut ────────────────────────────────
    renderDonutChart() {
        const ctx = document.getElementById('moodDonut');
        if (!ctx) return;
        if (this.donutChart) this.donutChart.destroy();

        const counts = {};
        CONFIG.MOODS.forEach(m => counts[m.value] = 0);
        this.moodData.forEach(e => { if (counts[e.mood] !== undefined) counts[e.mood]++; });

        const filtered = CONFIG.MOODS.filter(m => counts[m.value] > 0);
        if (!filtered.length) {
            // Show placeholder
            this.donutChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['rgba(0,0,0,.07)'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            return;
        }

        this.donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filtered.map(m => m.label),
                datasets: [{
                    data: filtered.map(m => counts[m.value]),
                    backgroundColor: filtered.map(m => CONFIG.CHART_COLORS[m.value]),
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { font: { family: 'DM Sans', size: 10 }, boxWidth: 10, padding: 8 } }
                }
            }
        });
    },

    // ─── ★ Stress Pattern Line Chart ────────────────────────
    renderStressChart() {
        const ctx = document.getElementById('stressChart');
        if (!ctx) return;
        if (this.stressChart) this.stressChart.destroy();

        const stressMoods = ['anxious','angry','sad'];
        const labels = [];
        const stressLevels = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
            labels.push(dayLabel);

            const dayEntries = this.moodData.filter(e => {
                const ed = new Date(e.timestamp);
                return ed.toDateString() === d.toDateString();
            });
            const stress = dayEntries.filter(e => stressMoods.includes(e.mood)).length;
            stressLevels.push(stress);
        }

        this.stressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Stress Level',
                    data: stressLevels,
                    borderColor: '#f472b6',
                    backgroundColor: 'rgba(244,114,182,.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f472b6',
                    pointRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 10 } } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.05)' } }
                }
            }
        });
    },

    // ─── ★ Usage Statistics ──────────────────────────────────
    renderStats() {
        const total = this.moodData.length;
        document.getElementById('totalEntries').textContent = total || '—';

        // Top mood
        if (total > 0) {
            const counts = {};
            this.moodData.forEach(e => counts[e.mood] = (counts[e.mood]||0) + 1);
            const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0];
            const cfg = CONFIG.MOODS.find(m => m.value === top);
            document.getElementById('topMood').textContent = cfg ? cfg.emoji : '—';
        } else {
            document.getElementById('topMood').textContent = '—';
        }

        // Streak
        let streak = 0;
        const today = new Date().toDateString();
        const dates = new Set(this.moodData.map(e => new Date(e.timestamp).toDateString()));
        let check = new Date();
        while (dates.has(check.toDateString())) {
            streak++;
            check.setDate(check.getDate() - 1);
        }
        document.getElementById('streakDays').textContent = streak > 0 ? streak : '—';
    },

    // ─── ★ AI Insight ────────────────────────────────────────
    renderInsight() {
        const el = document.getElementById('insightText');
        if (!el) return;

        if (this.moodData.length < 3) {
            el.textContent = 'Log at least 3 moods to unlock AI-powered stress pattern insights.';
            return;
        }

        const stressMoods = ['anxious','angry','sad'];
        const total = this.moodData.length;
        const stressCount = this.moodData.filter(e => stressMoods.includes(e.mood)).length;
        const pct = Math.round((stressCount / total) * 100);

        // Day-of-week analysis
        const dayCounts = new Array(7).fill(0);
        this.moodData.filter(e => stressMoods.includes(e.mood)).forEach(e => {
            dayCounts[new Date(e.timestamp).getDay()]++;
        });
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const stressiestDay = days[dayCounts.indexOf(Math.max(...dayCounts))];

        let insight = '';
        if (pct > 60) {
            insight = `⚠️ High stress detected (${pct}% of entries). Your stress tends to peak on ${stressiestDay}s. Daily breathing exercises are recommended.`;
        } else if (pct > 30) {
            insight = `📊 Moderate stress levels (${pct}%). ${stressiestDay}s appear to be your most challenging day. Try a 5-min breathing session on those days.`;
        } else {
            insight = `✅ Low stress levels detected (${pct}%). You're managing well! Keep up your current wellness routine.`;
        }
        el.textContent = insight;
    },

    // ─── Toast notification (replaces alert) ────────────────
    showToast(message, type = 'success') {
        const existing = document.getElementById('moodToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'moodToast';
        toast.className = `toast${type === 'error' ? ' error' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity .4s';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    // ─── Helpers ────────────────────────────────────────────
    relativeTime(timestamp) {
        const diff = Date.now() - new Date(timestamp);
        const m = Math.floor(diff/60000);
        const h = Math.floor(diff/3600000);
        const d = Math.floor(diff/86400000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        if (h < 24) return `${h}h ago`;
        if (d < 7) return `${d}d ago`;
        return new Date(timestamp).toLocaleDateString();
    },

    escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    },

    // ─── Init ────────────────────────────────────────────────
    init() {
        this.loadMoodData();

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn.getAttribute('data-mood')));
        });

        document.getElementById('saveMoodBtn')?.addEventListener('click', () => this.saveMood());
    }
};

window.MoodTracker = MoodTracker;