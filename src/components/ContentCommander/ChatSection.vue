<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import SoundManager from '../../sfx/SoundManager';
import { chatStore } from '../../store/chatStore';

const message = ref('');
const messageInput = ref(null);
const logContainer = ref(null);
const cursorOffset = ref(0);
const measurementSpan = ref(null);

const updateCursorPosition = () => {
    if (!messageInput.value || !measurementSpan.value) return;
    
    // Get text before cursor
    const textBeforeCursor = message.value.slice(0, messageInput.value.selectionStart);
    
    // We update a hidden span with the same font to measure width
    measurementSpan.value.textContent = textBeforeCursor;
    
    // Get width of text before cursor
    cursorOffset.value = measurementSpan.value.offsetWidth;
};

const isValidNickname = computed(() => chatStore.nickname.trim().length >= 3);

const focusInput = async () => {
    // Retry focus a few times to account for rendering/animation
    for (let i = 0; i < 3; i++) {
        await nextTick();
        if (messageInput.value) {
            messageInput.value.focus();
            scrollToBottom();
            break;
        }
        await new Promise(r => setTimeout(r, 50));
    }
};

const scrollToBottom = async () => {
    // We wait for two ticks to be absolutely sure the DOM has updated
    // and the container height has been recalculated.
    await nextTick();
    await nextTick();
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
};

const handleSend = async () => {
    if (!message.value.trim()) return;
    
    const text = message.value.trim();
    
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
    
    message.value = '';
    scrollToBottom();
    updateCursorPosition(); // Reset cursor position after sending
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
    scrollToBottom();
};

// Auto-scroll when new messages arrive or history is cleared
watch(() => chatStore.messages, () => {
    scrollToBottom();
}, { deep: true });

onMounted(() => {
    if (chatStore.isConnected) {
        chatStore.startPolling();
        scrollToBottom();
        // Small delay ensures users manually cycling past the tab with arrows don't get trapped in the input
        setTimeout(focusInput, 500);
    }
});

onUnmounted(() => {
// Polling remains active globally for background sync
});

const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
};
</script>

<template>
  <div class="section-content animate-in">
    <h3>> IRC.OWNEDGE.NET</h3>

    <!-- IRC Interface -->
    <div v-if="chatStore.isConnected" class="irc-container">
      <div class="irc-main">
        <div class="irc-header">
          <span class="chan">#OWNEDGE</span>
          <span v-if="!chatStore.isServerOnline" class="server-status">[OFFLINE: SYNC DISABLED]</span>
          <span class="topic">MODIFIED: 2025.12.30 | TOPIC: OWNEDGE - EST 2011</span>
        </div>
        <div class="irc-log" ref="logContainer">
          <div v-for="msg in chatStore.messages" :key="msg.id" :class="['msg', msg.type]">
            <span class="msg-time">[{{ formatTime(msg.timestamp) }}]</span>
            <template v-if="msg.type === 'system'">
              <span class="msg-content">{{ msg.text }}</span>
            </template>
            <template v-else-if="msg.type === 'action'">
              <span class="msg-content">{{ msg.text }}</span>
            </template>
            <template v-else>
              <span class="msg-user">&lt;{{ msg.user }}&gt;</span>
              <span class="msg-text">{{ msg.text }}</span>
            </template>
          </div>
        </div>
        <div class="irc-input-row">
        <div class="input-wrapper">
          <input 
            ref="messageInput"
            v-model="message" 
            type="text" 
            autocomplete="off"
            placeholder="type message or /command..."
            @keydown.enter="handleSend"
            @input="updateCursorPosition"
            @click="updateCursorPosition"
            @keyup="updateCursorPosition"
          />
          <span ref="measurementSpan" class="measurement-span"></span>
          <div 
            class="block-cursor" 
            :style="{ left: `calc(10px + ${cursorOffset}px)` }"
          ></div>
        </div>
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
.section-content h3 {
    margin-top: 0;
    color: var(--color-accent);
    border-bottom: 1px solid rgba(64, 224, 208, 0.3);
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 20px;
    font-size: 1.4rem;
    letter-spacing: 1px;
}

.section-content {
    display: flex;
    flex-direction: column;
    height: 90%;
    padding: 0 !important;
}

.irc-container {
    display: grid;
    grid-template-columns: 1fr 200px; /* Slightly wider sidebar */
    flex: 1; /* Fill available height */
    background: #050505;
    border: 1px solid #333;
    font-family: 'Microgramma', sans-serif;
    letter-spacing: 0.5px;
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
    padding: 10px 14px;
    border-bottom: 1px solid #333;
    font-size: 0.9rem;
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

.msg { margin-bottom: 6px; line-height: 1.5; display: flex; gap: 8px; }
.msg-time { color: #555; font-size: 0.9rem; flex-shrink: 0; }
.msg.system { color: #00ff00; font-size: 0.9rem; opacity: 0.8; }
.msg.action { color: var(--color-accent); font-style: italic; }
.msg-user { color: #fff; font-weight: bold; flex-shrink: 0; }
.msg-text { color: rgba(255,255,255,0.9); }
.msg-content { white-space: pre-wrap; word-break: break-all; }

.irc-input-row {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    background: #0a0a0a;
    border-top: 1px solid #222;
    gap: 12px;
}

.input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
}


.irc-input-row input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-family: 'Microgramma', sans-serif;
    font-size: 1.05rem;
    outline: none;
    padding: 0 10px;
    letter-spacing: 0.5px;
    caret-color: transparent; /* Hide native OS cursor */
}

.measurement-span {
    position: absolute;
    visibility: hidden;
    white-space: pre;
    font-family: 'Microgramma', sans-serif;
    font-size: 1.05rem;
    letter-spacing: 0.5px;
    pointer-events: none;
    left: 10px; /* Match input padding */
}

.block-cursor {
    position: absolute;
    width: 10px;
    height: 1.2rem;
    background: #bbb;
    pointer-events: none;
    animation: smooth-blink 1.1s ease-in-out infinite;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 5px #bbb;
}

@keyframes smooth-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

.irc-sidebar {
    background: #0a0a0a;
    display: flex;
    flex-direction: column;
    min-height: 0; /* CRITICAL: Allow flex item to shrink below content height */
    height: 100%; /* Force it to fill the irc-container grid cell */
}

.sidebar-header {
    padding: 10px 14px;
    background: #111;
    border-bottom: 1px solid #333;
    font-size: 0.85rem;
    color: #666;
    letter-spacing: 1px;
}

.user-list {
    flex: 1;
    padding: 10px;
    font-size: 0.95rem;
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
