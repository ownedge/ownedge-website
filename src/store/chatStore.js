import { reactive } from 'vue';

const isProd = import.meta.env.PROD;
const API_BASE = isProd ? '/chat.php' : 'https://ownedge.com/chat.php';

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
                if (Array.isArray(data)) {
                    const lastLocal = this.messages[this.messages.length - 1];
                    const lastServer = data[data.length - 1];
                    
                    if (!lastLocal || !lastServer || lastLocal.id !== lastServer.id || data.length !== this.messages.length) {
                        this.messages = data;
                    }
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

    async leave() {
        if (!this.isConnected || !this.nickname) return;
        try {
            await fetch(`${API_BASE}?action=leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: this.nickname }),
                keepalive: true 
            });
        } catch (e) {}
    },

    handleVisibility() {
        if (document.visibilityState === 'visible' && this.isConnected) {
            this.sendHeartbeat();
            this.fetchMessages();
        }
    },

    startPolling() {
        if (this.pollingInterval) return;
        
        // 1. Setup Visibility Listener with saved reference for clean removal
        this._handler = this.handleVisibility.bind(this);
        document.addEventListener('visibilitychange', this._handler);

        // 2. Initial Sync
        this.sendHeartbeat();
        this.fetchMessages();
        this.fetchUsers();
        
        // 3. Main Sync Loop (Messages/Users)
        let lastBackgroundSync = 0;
        this.pollingInterval = setInterval(() => {
            const isVisible = document.visibilityState === 'visible';
            const now = Date.now();

            if (isVisible) {
                // Foreground: Regular 2s sync
                this.fetchMessages();
                this.fetchUsers();
            } else if (now - lastBackgroundSync > 30000) {
                // Background: Slow 30s sync
                this.fetchMessages();
                this.fetchUsers();
                lastBackgroundSync = now;
            }
        }, 2000);

        // 4. Heartbeat Loop (Stays consistent at 10s to prevent timeout)
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 10000);

        // 5. Exit Listener
        this._unloadHandler = () => this.leave();
        window.addEventListener('beforeunload', this._unloadHandler);
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
        if (this._handler) {
            document.removeEventListener('visibilitychange', this._handler);
            this._handler = null;
        }
    },

    clearHistory() {
        this.messages = [];
    }
});
