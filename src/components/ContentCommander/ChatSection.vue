<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import SoundManager from '../../sfx/SoundManager';
import { chatStore } from '../../store/chatStore';

const inputMessage = ref('');
const inputRef = ref(null);
const chatScroll = ref(null);

const isValidNickname = computed(() => chatStore.nickname.trim().length >= 3);

const focusInput = async () => {
    // Retry focus a few times to account for rendering/animation
    for (let i = 0; i < 3; i++) {
        await nextTick();
        if (inputRef.value) {
            inputRef.value.focus();
            scrollToBottom();
            break;
        }
        await new Promise(r => setTimeout(r, 50));
    }
};

const scrollToBottom = async () => {
    await nextTick();
    if (chatScroll.value) {
        chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
    }
};

const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;
    
    const text = inputMessage.value.trim();
    
    if (text.startsWith('/')) {
        handleCommand(text);
    } else {
        await chatStore.addMessage({
            type: 'user',
            user: chatStore.nickname,
            text
        });
        SoundManager.playTypingSound();
    }
    
    inputMessage.value = '';
    scrollToBottom();
};

const handleCommand = (cmd) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    
    if (command === '/me' && parts.length > 1) {
        chatStore.addMessage({
            type: 'action',
            text: `* ${chatStore.nickname} ${parts.slice(1).join(' ')}`
        });
    } else if (command === '/clear') {
        chatStore.clearHistory();
    } else if (command === '/help') {
        chatStore.addMessage({ type: 'system', text: 'Available commands: /me <action>, /clear, /help' });
    } else {
        chatStore.addMessage({ type: 'system', text: `*** Unknown command: ${command}` });
    }
};

// Auto-scroll when new messages arrive from polling
watch(() => chatStore.messages.length, () => {
    scrollToBottom();
});

onMounted(() => {
    if (chatStore.isConnected) {
        chatStore.startPolling();
        scrollToBottom();
        focusInput();
    }
});

onUnmounted(() => {
    // Polling remains active globally for background sync
});
</script>

<template>
  <div class="section-content animate-in">
    <h3>> IRC.CLIENT -- #OWNEDGE</h3>

    <!-- IRC Interface -->
    <div v-if="chatStore.isConnected" class="irc-container">
      <div class="irc-main">
        <div class="irc-header">
          <span class="chan">#OWNEDGE</span>
          <span v-if="!chatStore.isServerOnline" class="server-status">[OFFLINE: SYNC DISABLED]</span>
          <span class="topic">MODIFIED: 2025.12.30 | TOPIC: OWNEDGE - EST 2011</span>
        </div>
        <div class="irc-log" ref="chatScroll">
          <div v-for="msg in chatStore.messages" :key="msg.id" :class="['msg', msg.type]">
            <template v-if="msg.type === 'system'">{{ msg.text }}</template>
            <template v-else-if="msg.type === 'action'">{{ msg.text }}</template>
            <template v-else>
              <span class="msg-user">&lt;{{ msg.user }}&gt;</span>
              <span class="msg-text">{{ msg.text }}</span>
            </template>
          </div>
        </div>
        <div class="irc-input-row">
          <span class="nick">[{{ chatStore.nickname }}]</span>
          <input 
            ref="inputRef"
            v-model="inputMessage" 
            placeholder="Type message or /command..." 
            @keyup.enter="sendMessage"
          />
        </div>
      </div>
      <div class="irc-sidebar">
        <div class="sidebar-header">USERS [{{ chatStore.users.length + 1 }}]</div>
        <div class="user-list">
          <div class="user-item self">{{ chatStore.nickname }}</div>
          <div v-for="u in chatStore.users" :key="u" class="user-item">{{ u }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.persistent-mode {
    padding: 0 !important;
    height: 100%;
}

.irc-container {
    display: grid;
    grid-template-columns: 1fr 200px; /* Slightly wider sidebar */
    height: 500px; /* Fixed height for the IRC "window" */
    background: #050505;
    border: 1px solid #333;
    font-family: 'JetBrains Mono', monospace;
    overflow: hidden; /* Prevent container from expanding */
}

.irc-main {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #333;
    min-height: 0; /* CRITICAL: Allow flex item to shrink below content height */
    height: 100%; /* Force it to fill the irc-container grid cell */
}

.irc-header {
    background: #111;
    padding: 8px 12px;
    border-bottom: 1px solid #333;
    font-size: 0.8rem;
    display: flex;
    gap: 20px;
}

.irc-header .chan { color: var(--color-accent); font-weight: bold; }
.irc-header .server-status { color: #ff0000; font-size: 0.7rem; font-weight: bold; background: rgba(255,0,0,0.1); padding: 0 5px; }
.irc-header .topic { color: #888; }

.irc-log {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    font-size: 0.9rem;
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
}

.msg { margin-bottom: 4px; line-height: 1.4; }
.msg.system { color: #00ff00; font-size: 0.8rem; opacity: 0.8; }
.msg.action { color: var(--color-accent); font-style: italic; }
.msg-user { color: #fff; font-weight: bold; margin-right: 8px; }
.msg-text { color: rgba(255,255,255,0.9); }

.irc-input-row {
    padding: 10px;
    background: #0a0a0a;
    border-top: 1px solid #333;
    display: flex;
    gap: 10px;
    align-items: center;
}

.irc-input-row .nick { color: var(--color-accent); font-size: 0.85rem; }
.irc-input-row input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
}

.irc-sidebar {
    background: #0a0a0a;
    display: flex;
    flex-direction: column;
    min-height: 0; /* CRITICAL: Allow flex item to shrink below content height */
    height: 100%; /* Force it to fill the irc-container grid cell */
}

.sidebar-header {
    padding: 9px 12px;
    background: #111;
    border-bottom: 1px solid #333;
    font-size: 0.75rem;
    color: #666;
    letter-spacing: 1px;
}

.user-list {
    flex: 1;
    padding: 10px;
    font-size: 0.85rem;
    overflow-y: auto; /* Scrollable users if list is long */
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
}

.user-item { color: #ccc; margin-bottom: 4px; }
.user-item.self { color: var(--color-accent); }

.animate-in { animation: slideUp 0.3s ease-out; }
@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-leave-active { transition: opacity 0.5s; }
.fade-leave-to { opacity: 0; }
</style>
