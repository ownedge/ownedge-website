<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import SoundManager from '../sfx/SoundManager';

const tabs = [
  { id: 'about', name: 'ABOUT', icon: 'ⓘ' },
  { id: 'business', name: 'BUSINESS', icon: '⚒' },
  { id: 'blog', name: 'BLOG', icon: '📝' },
  { id: 'guestbook', name: 'GUESTBOOK', icon: '✍' },
  { id: 'chat', name: 'CHAT', icon: '💬' }
];

const activeTabIndex = ref(0);
const activeKey = ref(null);
const viewportContent = ref(null);

const activeTab = computed(() => tabs[activeTabIndex.value]);

const selectTab = (index) => {
  if (activeTabIndex.value !== index) {
      activeTabIndex.value = index;
      SoundManager.playHoverSound();
      if (viewportContent.value) viewportContent.value.scrollTop = 0;
  }
};

// Keyboard Navigation
const handleKeydown = (e) => {
    // F-keys visual feedback
    if (e.key.startsWith('F')) {
        e.preventDefault();
        if (activeKey.value !== e.key) SoundManager.playTypingSound();
        activeKey.value = e.key;
        return;
    }

    // Tab switching
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        selectTab((activeTabIndex.value + 1) % tabs.length);
        SoundManager.playTypingSound();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab((activeTabIndex.value - 1 + tabs.length) % tabs.length);
        SoundManager.playTypingSound();
    }

    // Content Scroll
    if (e.key === 'ArrowDown') {
        if (viewportContent.value) viewportContent.value.scrollTop += 40;
    } else if (e.key === 'ArrowUp') {
        if (viewportContent.value) viewportContent.value.scrollTop -= 40;
    }
}

const handleKeyup = (e) => {
    if (e.key.startsWith('F')) {
        activeKey.value = null;
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
});

</script>

<template>
  <div class="tui-container">
    <div class="tui-frame">
      <!-- Top Bar -->
      <div class="tui-header">
        <span class="title">CONTENT COMMANDER (v1.0)</span>
        <span class="clock">640K BASE MEM OK</span>
      </div>

      <!-- Tab Bar -->
      <div class="tui-tab-bar">
          <div 
            v-for="(tab, index) in tabs" 
            :key="tab.id"
            class="tui-tab"
            :class="{ active: activeTabIndex === index }"
            @click="selectTab(index)"
          >
            <span class="tab-bracket">[</span>
            <span class="tab-name">{{ tab.name }}</span>
            <span class="tab-bracket">]</span>
          </div>
      </div>

      <!-- Main Contents -->
      <div class="tui-viewport custom-scroll" ref="viewportContent">
          
          <!-- ABOUT SECTION -->
          <div v-if="activeTab.id === 'about'" class="section-content animate-in">
              <h3>> WHOAMI</h3>
              <p>System initialization complete. Welcome to OWNEDGE OS.</p>
              <p>I am a creative technologist focused on high-fidelity digital experiences. This terminal serves as a central hub for all project-related telemetry and communication protocols.</p>
              <div class="status-grid">
                  <div class="status-item"><span>CPU:</span> <span>80486DX4</span></div>
                  <div class="status-item"><span>OS:</span> <span>OWNEDGE-V2</span></div>
                  <div class="status-item"><span>LOC:</span> <span>BERLIN.DE</span></div>
                  <div class="status-item"><span>AUTH:</span> <span>ADMIN</span></div>
              </div>
          </div>

          <!-- BUSINESS SECTION -->
          <div v-else-if="activeTab.id === 'business'" class="section-content animate-in">
              <h3>> OFFERINGS.DAT</h3>
              <div class="service-list">
                  <div class="service-row">
                      <span class="service-name">UI/UX ENGINEERING</span>
                      <span class="service-cost">PREMIUM</span>
                  </div>
                  <div class="service-row">
                      <span class="service-name">WEBGL/3D SYNTHESIS</span>
                      <span class="service-cost">HI-END</span>
                  </div>
                   <div class="service-row">
                      <span class="service-name">BRAND IDENTITY</span>
                      <span class="service-cost">CORE</span>
                  </div>
              </div>
              <p class="blink-fast" style="margin-top: 20px;">READY FOR NEW ASSIGNMENTS_</p>
          </div>

          <!-- BLOG SECTION -->
          <div v-else-if="activeTab.id === 'blog'" class="section-content animate-in">
              <h3>> LOGS.LOG</h3>
              <div class="blog-entry">
                  <span class="entry-date">2024.12.28</span>
                  <span class="entry-title">CRT SHADER OPTIMIZATION COMPLETE</span>
              </div>
              <div class="blog-entry">
                  <span class="entry-date">2024.12.15</span>
                  <span class="entry-title">MIGRATING TO OWNEDGE-V2 CORE</span>
              </div>
              <div class="blog-entry">
                  <span class="entry-date">2024.11.30</span>
                  <span class="entry-title">PHOSPHOR DECAY LOGIC REFINED</span>
              </div>
          </div>

          <!-- GUESTBOOK SECTION -->
          <div v-else-if="activeTab.id === 'guestbook'" class="section-content animate-in">
              <h3>> GUEST LOG</h3>
              <p>Leave your mark on the system memory.</p>
              <div class="input-simulation">
                  <span>NAME:</span> <span class="cursor-block">_</span>
              </div>
              <div class="recent-messages">
                  <p class="msg">"System looks tight." - user_01</p>
                  <p class="msg">"10/10 vibes." - retro_fan</p>
              </div>
          </div>

          <!-- CHAT SECTION -->
          <div v-else-if="activeTab.id === 'chat'" class="section-content animate-in">
              <h3>> COMMS.EXE</h3>
              <div class="chat-window">
                  <div class="chat-log">
                      <p><span class="node">[NODE_0]</span> CONNECTED</p>
                      <p><span class="node">[NODE_1]</span> SYNCING_</p>
                  </div>
                  <div class="chat-input">>_</div>
              </div>
          </div>

      </div>

      <!-- Bottom Function Keys -->
      <div class="tui-footer">
        <div class="f-key" :class="{ active: activeKey === 'F1' }"><span>F1</span> <span class="f-label">HELP</span></div>
        <div class="f-key" :class="{ active: activeKey === 'F2' }"><span>F2</span> <span class="f-label">LINK</span></div>
        <div class="f-key" :class="{ active: activeKey === 'F3' }"><span>F3</span> <span class="f-label">VIEW</span></div>
        <div class="f-key" :class="{ active: activeKey === 'F4' }"><span>F4</span> <span class="f-label">QUIT</span></div>
        <div class="f-key sys-status"><span>ONLINE</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: transparent;
  font-family: 'Microgramma', monospace; 
  color: #fff;
  box-sizing: border-box;
}

.tui-frame {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.tui-header {
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-weight: bold;
  font-size: 1.1rem;
  border-bottom: 2px solid #fff;
  letter-spacing: 2px;
}

/* Tab Bar */
.tui-tab-bar {
    display: flex;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding: 10px 20px;
    gap: 10px;
}

.tui-tab {
    padding: 5px 15px;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}

.tui-tab:hover {
    opacity: 1;
    background: rgba(255,255,255,0.05);
}

.tui-tab.active {
    opacity: 1;
    color: var(--color-accent);
}

.tab-bracket {
    font-weight: bold;
    color: #444;
}

.active .tab-bracket {
    color: var(--color-accent);
}

.tab-name {
    font-size: 0.9rem;
    font-weight: bold;
}

/* Viewport Area */
.tui-viewport {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
  font-size: 1.2rem;
  line-height: 1.5;
}

.section-content h3 {
    margin-top: 0;
    color: var(--color-accent);
    border-bottom: 1px solid rgba(64, 224, 208, 0.3);
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 20px;
    font-size: 1.4rem;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 30px;
    background: rgba(255,255,255,0.02);
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.1);
}

.status-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #888;
}

.status-item span:last-child {
    color: #fff;
    font-weight: bold;
}

.service-list {
    margin-bottom: 20px;
}

.service-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.1);
}

.service-name { font-weight: bold; }
.service-cost { color: var(--color-accent); }

.blog-entry {
    margin-bottom: 15px;
    padding: 10px;
    border-left: 3px solid var(--color-accent);
    background: rgba(64, 224, 208, 0.05);
}

.entry-date { display: block; font-size: 0.8rem; opacity: 0.5; }
.entry-title { font-weight: bold; }

.input-simulation {
    background: #111;
    padding: 15px;
    border: 1px solid #333;
    margin: 20px 0;
}

.cursor-block {
    animation: blink-fast 0.6s step-end infinite;
    background: var(--color-accent);
    color: #000;
}

.recent-messages {
    font-size: 0.9rem;
    opacity: 0.7;
}

.chat-window {
    background: #000;
    border: 1px solid var(--color-accent);
    height: 150px;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.chat-log { flex: 1; font-size: 0.9rem; }
.chat-input { margin-top: 10px; color: var(--color-accent); font-weight: bold; }
.node { color: var(--color-accent); opacity: 0.8; }

/* Custom Scroll */
.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; }

/* Footer */
.tui-footer {
    display: flex;
    padding: 15px 30px;
    gap: 20px;
    border-top: 2px solid #fff;
    background: rgba(255,255,255,0.02);
}

.f-key {
    font-size: 0.9rem;
    color: #666;
    display: flex;
    align-items: center;
}

.f-key span:first-child {
    background: #333;
    color: #ccc;
    padding: 2px 6px;
    margin-right: 6px;
    font-weight: bold;
}

.f-key.active span:first-child {
    background: var(--color-accent);
    color: #000;
}

.sys-status {
    margin-left: auto;
    color: var(--color-accent);
    font-weight: bold;
}

/* Animations */
.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes blink-fast {
    50% { opacity: 0; }
}

.blink-fast {
    animation: blink-fast 0.8s step-end infinite;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .tui-tab-bar {
        overflow-x: auto;
        padding-bottom: 5px;
    }
    .tui-tab {
        flex-shrink: 0;
    }
    .status-grid {
        grid-template-columns: 1fr;
    }
}
</style>
