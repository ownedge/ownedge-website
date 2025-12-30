import { reactive } from 'vue';

const isProd = import.meta.env.PROD;
const SERVER_URL = isProd ? '/chat.php' : 'http://localhost:3001/messages';

export const chatStore = reactive({
    nickname: '',
    isConnected: false,
    showPopup: true,
    messages: [],
    users: ['juca', 'guest_12', 'cyber_monk'],
    pollingInterval: null,
    isServerOnline: true,
    
    async init() {
        await this.fetchMessages();
        this.startPolling();
    },

    async fetchMessages() {
        try {
            const response = await fetch(SERVER_URL);
            if (response.ok) {
                const data = await response.json();
                // Only update if count changed or for first load
                if (data.length !== this.messages.length) {
                    this.messages = data;
                }
                this.isServerOnline = true;
            } else {
                this.isServerOnline = false;
            }
        } catch (e) {
            console.error("Chat Server Offline:", e);
            this.isServerOnline = false;
        }
    },

    async addMessage(msg) {
        const localId = Date.now() + Math.random();
        const localMsg = { 
            ...msg, 
            id: localId, 
            user: msg.user || this.nickname,
            timestamp: new Date().toISOString()
        };
        
        // Optimistic update: Add locally first so it shows up immediately
        this.messages.push(localMsg);

        try {
            const response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localMsg)
            });
            
            if (response.ok) {
                this.isServerOnline = true;
                // Re-fetch to sync with server timestamps and other users' messages
                await this.fetchMessages();
            } else {
                this.isServerOnline = false;
            }
        } catch (e) {
            console.error("Failed to sync message to server:", e);
            this.isServerOnline = false;
        }
    },
    
    startPolling() {
        if (this.pollingInterval) return;
        this.pollingInterval = setInterval(() => this.fetchMessages(), 2000);
    },

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },

    clearHistory() {
        // Technically this should be a server command too, 
        // but for now we'll just clear local view if needed.
        // Actually, let's just make it clear local for this client.
        this.messages = [];
    }
});
