<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import SoundManager from '../../sfx/SoundManager';
import { chatStore } from '../../store/chatStore';

const isConnecting = ref(false);
const inputMessage = ref('');
const inputRef = ref(null);
const chatScroll = ref(null);
const canvasRef = ref(null);
let animationFrameId = null;

const isValidNickname = computed(() => chatStore.nickname.trim().length >= 3);

// --- CONFIGURATION ---
const VISUALIZATION_CONFIG = {
    minFreqIndex: 0,    // Start bin (0-127)
    maxFreqIndex: 15,   // End bin (0-127) - Precise focus on typical modem handshake frequencies
    threshold: 150,     // Signal sensitivity (0-255)
    dotSize: 4.0,
    gap: 5,
    horizontalPadding: 10 // Added to prevent clipping on the left
};

const handleConnect = async () => {
    if (!isValidNickname.value || isConnecting.value) return;
    
    isConnecting.value = true;
    
    // Ensure SoundManager is initialized (in case user jumps here)
    if (!SoundManager.initialized) SoundManager.init();
    
    // Play dial-up sound and wait for it to finish
    // SoundManager.playDialUpSound returns a promise that resolves when sound ends
    const soundPromise = SoundManager.playDialUpSound();
    
    // Start visualization
    await nextTick(); // Wait for canvas to be in DOM
    startVisualization();
    
    await soundPromise;
    
    stopVisualization();
    isConnecting.value = false;
    chatStore.isConnected = true;
    chatStore.showPopup = false;
    
    // Initial sync and start polling
    await chatStore.init();
    
    // Final join messages
    await chatStore.addMessage({ type: 'system', text: `*** ${chatStore.nickname} has joined #ownedge` });
    await chatStore.addMessage({ type: 'system', text: '*** Topic is: OWNEDGE - EST 2011' });
    
    scrollToBottom();
    focusInput();
};

const startVisualization = () => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
        const data = SoundManager.getDialUpAudioData();
        if (data) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const { minFreqIndex, maxFreqIndex, threshold, dotSize, gap, horizontalPadding } = VISUALIZATION_CONFIG;
            const range = maxFreqIndex - minFreqIndex;
            // Subtract padding from both sides to center the visualization range
            const pointsToShow = Math.floor((canvas.width - (horizontalPadding * 2)) / (dotSize + gap));
            const step = range / pointsToShow;
            
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0000';

            for (let i = 0; i < pointsToShow; i++) {
                const dataIndex = Math.floor(minFreqIndex + (i * step));
                if (dataIndex < data.length && data[dataIndex] > threshold) {
                    const x = horizontalPadding + (i * (dotSize + gap));
                    const val = (data[dataIndex] / 255) * canvas.height;
                    
                    // Draw square dots instead of circles
                    ctx.fillRect(x - dotSize/2, canvas.height - val - dotSize/2, dotSize, dotSize);
                }
            }
            ctx.shadowBlur = 0; // Reset for next frame
        }
        animationFrameId = requestAnimationFrame(draw);
    };
    draw();
};

const stopVisualization = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
        // Since we don't have a server clear yet, we just clear local view
    } else if (command === '/help') {
        chatStore.addMessage({ type: 'system', text: 'Available commands: /me <action>, /clear, /help' });
    } else {
        chatStore.addMessage({ type: 'system', text: `*** Unknown command: ${command}` });
    }
};

const focusInput = async () => {
    await nextTick();
    inputRef.value?.focus();
};

const scrollToBottom = async () => {
    await nextTick();
    if (chatScroll.value) {
        chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
    }
};

// Auto-scroll when new messages arrive from polling
watch(() => chatStore.messages.length, () => {
    scrollToBottom();
});

// If already connected, make sure we resume polling and scroll to bottom
onMounted(() => {
    if (chatStore.isConnected) {
        chatStore.startPolling();
        scrollToBottom();
        focusInput();
    }
});

onUnmounted(() => {
    stopVisualization();
    chatStore.stopPolling();
});
</script>

<template>
  <div class="section-content animate-in">
    <h3>> IRC.CLIENT -- #OWNEDGE</h3>

    <!-- Connection Popup -->
    <Transition name="fade">
      <div v-if="chatStore.showPopup" class="popup-overlay">
        <div class="popup-box">
          <div class="popup-header">LOGIN REQUIRED</div>
          <div class="popup-body">
            <p>IDENTIFY YOURSELF TO JOIN THE NODE</p>
            <div class="input-group">
              <span class="prompt">NICKNAME:</span>
              <input 
                v-model="chatStore.nickname" 
                type="text" 
                placeholder="---" 
                maxlength="12"
                :disabled="isConnecting"
                @keyup.enter="handleConnect"
                autofocus
              />
            </div>
            
            <div v-if="isConnecting" class="connection-status">
              <div class="dialing">DIALING... ESTABLISHING HANDSHAKE</div>
              <canvas ref="canvasRef" width="200" height="40" class="viz-canvas"></canvas>
            </div>

            <button 
              class="connect-btn" 
              :disabled="!isValidNickname || isConnecting"
              @click="handleConnect"
            >
              [ {{ isConnecting ? 'CONNECTING...' : 'CONNECT' }} ]
            </button>
          </div>
        </div>
      </div>
    </Transition>

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
.irc-container {
    display: grid;
    grid-template-columns: 1fr 180px;
    height: 450px;
    background: #050505;
    border: 1px solid #333;
    font-family: 'JetBrains Mono', monospace;
}

.irc-main {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #333;
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
}

.sidebar-header {
    padding: 8px 12px;
    background: #111;
    border-bottom: 1px solid #333;
    font-size: 0.75rem;
    color: #666;
    letter-spacing: 1px;
}

.user-list {
    padding: 10px;
    font-size: 0.85rem;
}

.user-item { color: #ccc; margin-bottom: 4px; }
.user-item.self { color: var(--color-accent); }

/* Popup Styles */
.popup-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    background: #000;
    border: 1px solid var(--color-accent);
    box-shadow: 0 0 30px rgba(64, 224, 208, 0.2);
    z-index: 1000;
}

.popup-header {
    background: var(--color-accent);
    color: #000;
    padding: 4px 10px;
    font-weight: bold;
    font-size: 0.8rem;
    letter-spacing: 1px;
}

.popup-body {
    padding: 20px;
    text-align: center;
}

.popup-body p { font-size: 0.8rem; color: #888; margin-bottom: 20px; }

.input-group {
    display: flex;
    gap: 10px;
    align-items: center;
    background: #111;
    padding: 8px 12px;
    border: 1px solid #333;
    margin-bottom: 20px;
}

.prompt { color: var(--color-accent); font-size: 0.8rem; font-weight: bold; }
.input-group input {
    background: transparent;
    border: none;
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    width: 100%;
    outline: none;
}

.connection-status {
    margin-bottom: 20px;
}

.dialing {
    font-size: 0.7rem;
    color: var(--color-accent);
    margin-bottom: 10px;
    text-transform: uppercase;
}

.connect-btn {
    background: transparent;
    border: none;
    color: var(--color-accent);
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s;
}

.connect-btn:disabled { color: #444; cursor: not-allowed; }
.connect-btn:not(:disabled):hover { text-shadow: 0 0 10px var(--color-accent); }

.animate-in { animation: slideUp 0.3s ease-out; }
@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-leave-active { transition: opacity 0.5s; }
.fade-leave-to { opacity: 0; }
</style>
