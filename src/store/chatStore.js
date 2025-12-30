import { reactive } from 'vue';

const API_BASE = '/chat.php';

export const chatStore = reactive({
    nickname: '',
    isConnected: false,
    showPopup: true,
    messages: [],
    users: [],
    pollingInterval: null,
    heartbeatInterval: null,
    isServerOnline: true,
    
    async init() {
        await Promise.all([
            this.fetchMessages(),
            this.fetchUsers()
        ]);
        this.startPolling();
    },

    async fetchMessages() {
        try {
            const response = await fetch(`${API_BASE}?action=messages`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length !== this.messages.length) {
                    this.messages = data;
                }
                this.isServerOnline = true;
            } else {
                console.warn(`Chat Sync Failed: ${response.status} ${response.statusText}`);
                this.isServerOnline = false;
            }
        } catch (e) {
            console.error("Chat Network Error (Is PHP server running on :8000?):", e);
            this.isServerOnline = false;
        }
    },

    async fetchUsers() {
        try {
            const response = await fetch(`${API_BASE}?action=users`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    this.users = data.filter(u => u !== this.nickname);
                } else {
                    console.error("fetchUsers: Expected array, got:", data);
                }
            } else {
                const body = await response.text();
                console.error(`fetchUsers Failed (${response.status}):`, body);
            }
        } catch (e) {
            console.error("fetchUsers Error:", e);
        }
    },

    async sendHeartbeat() {
        if (!this.isConnected || !this.nickname) return;
        try {
            await fetch(`${API_BASE}?action=presence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: this.nickname })
            });
        } catch (e) {}
    },

    async addMessage(msg) {
        const localId = Date.now() + Math.random();
        const localMsg = { 
            ...msg, 
            id: localId, 
            user: msg.user || this.nickname,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(localMsg);

        try {
            const response = await fetch(`${API_BASE}?action=messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localMsg)
            });
            
            if (response.ok) {
                this.isServerOnline = true;
                await this.fetchMessages();
            } else {
                this.isServerOnline = false;
            }
        } catch (e) {
            this.isServerOnline = false;
        }
    },
    
    startPolling() {
        if (this.pollingInterval) return;
        this.pollingInterval = setInterval(() => {
            this.fetchMessages();
            this.fetchUsers();
        }, 2000);
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 5000);
    },

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },

    clearHistory() {
        // Technically this should be a server command too, 
        // but for now we'll just clear local view if needed.
        // Actually, let's just make it clear local for this client.
        this.messages = [];
    }
});
