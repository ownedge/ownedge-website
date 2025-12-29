<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import SoundManager from '../../sfx/SoundManager';
import AboutSection from './AboutSection.vue';
import BusinessSection from './BusinessSection.vue';
import BlogSection from './BlogSection.vue';
import GuestbookSection from './GuestbookSection.vue';
import ChatSection from './ChatSection.vue';

const tabs = [
  { id: 'about', name: 'ABOUT', component: AboutSection },
  { id: 'business', name: 'BUSINESS', component: BusinessSection },
  { id: 'blog', name: 'BLOG', component: BlogSection },
  { id: 'guestbook', name: 'GUESTBOOK', component: GuestbookSection },
  { id: 'chat', name: 'CHAT', component: ChatSection }
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
            <span class="tab-name">{{ tab.name }}</span>
          </div>
      </div>

      <!-- Main Contents -->
      <div class="tui-viewport custom-scroll" ref="viewportContent">
          <component :is="activeTab.component" />
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
  letter-spacing: 2px;
}

/* Tab Bar */
.tui-tab-bar {
    display: flex;
    padding: 0;
    gap: 0;
    align-items: stretch;
    height: 44px;
    margin: 15px 0; /* Margin for overlapping mask */
}

.tui-tab-bar::before {
    content: '';
    width: 30px; /* Left-side cap */
    background: #fff;
}

.tui-tab-bar::after {
    content: '';
    flex: 1; /* Pushes tabs to the left */
    background: #fff;
    min-width: 15px;
}

.tui-tab {
    padding: 0 30px;
    cursor: pointer;
    color: #000;
    background: #fff;
    display: flex;
    align-items: center;
    transition: none;
    height: 100%;
}

.tui-tab:hover:not(.active) {
    background: #f0f0f0;
}

.tui-tab.active {
    background: transparent;
    color: #fff;
    height: 64px; /* Taller than the bar */
    align-self: center;
    position: relative;
    z-index: 5;
}

.tab-name {
    font-size: 0.85rem;
    font-weight: bold;
    letter-spacing: 1px;
}

/* Viewport Area */
.tui-viewport {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
  font-size: 1.2rem;
  line-height: 1.5;
}

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

/* Mobile Responsive */
@media (max-width: 768px) {
    .tui-tab-bar {
        overflow-x: auto;
        padding-bottom: 5px;
    }
    .tui-tab {
        flex-shrink: 0;
    }
}
</style>
