<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../utils/SoundManager';

const projects = [
  {
    id: 'p1',
    name: 'OWNEDGEOS.SYS',
    type: 'SYSTEM',
    date: '2024-12-01',
    description: `
      > SYSTEM KERNEL ARCHITECTURE
      ---------------------------

      Core operating system for the Ownedge network. 
      Built on high-performance distributed nodes.

      FEATURES:
      * Real-time signal processing
      * Neural net integration
      * Quantum-resistant encryption layer
      
      STATUS: ACTIVE
      VERSION: 2.4.1
    `
  },
  {
    id: 'p2',
    name: 'FLUX_ENGINE.EXE',
    type: 'BINARY',
    date: '2024-10-15',
    description: `
      > FLUX GENERATION ENGINE
      -----------------------

      Procedural content generation subsystem. 
      Handles dynamic asset streaming and
      visual synthesis.

      CAPABILITIES:
      * 4K Texture Synthesis
      * Audio Reactive Patterns
      * Low-latency Render Loop

      STATUS: COMPILING...
    `
  },
  {
    id: 'p3',
    name: 'NEURAL_LINK.DAT',
    type: 'DATA',
    date: '2024-08-20',
    description: `
      > NEURAL INTERFACE DATA
      ----------------------

      Collected telemetry from user interactions.
      Used to train the main AI model for
      better prediction accuracy.

      SIZE: 4.2 PB
      ENCRYPTION: AES-4096

      ACCESS: RESTRICTED
    `
  },
  {
    id: 'p4',
    name: 'PROTOCOL_7.TXT',
    type: 'DOC',
    date: '2024-06-01',
    description: `
      > PROTOCOL 7 SPECIFICATION
      -------------------------

      Standard operating procedure for 
      anomalous signal detection.

      1. Isolate signal
      2. Decrypt header
      3. Verify checksum
      4. Execute payload
      5. Verify signature
      6. Update system
      7. Restart
      8. Reboot
      9. Shutdown
      10. Power off

      DO NOT DEVIATE.
    `
  }
];

const selectedIndex = ref(0);
const activePane = ref('left'); // 'left' or 'right'
const activeKey = ref(null);
const viewContent = ref(null);

const selectProject = (index) => {
  if (selectedIndex.value !== index) {
      selectedIndex.value = index;
      SoundManager.playHoverSound(); // Reuse hover chirp for selection
  }
};

// Keyboard Navigation
const handleKeydown = (e) => {
    // Check for F-keys
    if (e.key.startsWith('F')) {
        e.preventDefault();
        // Only play sound if the key wasn't already active (prevent rapid fire on hold)
        if (activeKey.value !== e.key) {
            SoundManager.playTypingSound();
        }
        activeKey.value = e.key;
        return;
    }

    // Tab to switch panes
    if (e.key === 'Tab') {
        e.preventDefault();
        activePane.value = activePane.value === 'left' ? 'right' : 'left';
        SoundManager.playTypingSound(); // Feedback for switch
        return;
    }

    if (activePane.value === 'left') {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (selectedIndex.value + 1) % projects.length;
            selectedIndex.value = next;
            SoundManager.playTypingSound();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (selectedIndex.value - 1 + projects.length) % projects.length;
            selectedIndex.value = prev;
            SoundManager.playTypingSound();
        }
    } else {
        // Right Pane Scroll
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (viewContent.value) viewContent.value.scrollTop += 20;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (viewContent.value) viewContent.value.scrollTop -= 20;
        }
    }
}

const handleKeyup = (e) => {
    console.log('Key up:', e.key);
    if (e.key.startsWith('F')) {
        activeKey.value = null;
        console.log('Active key cleared');
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
        <span class="title">[ OWNEDGE PORTFOLIO MANAGER v1.0 ]</span>
        <span class="clock">MEM: 640K OK</span>
      </div>

      <!-- Main Content Area: Split Panes -->
      <div class="tui-panes">
        
        <!-- Left Pane: File List -->
        <div class="tui-pane left-pane" :class="{ 'active-pane': activePane === 'left' }">
          <div class="pane-header">
             <div class="pane-title"> C:\PROJECTS\*.* </div>
          </div>
          <div class="pane-content custom-scroll">
             <div class="column-headers">
                <span class="col-name">NAME</span>
                <span class="col-type">EXT</span>
                <span class="col-date">DATE</span>
             </div>
             <div 
                v-for="(p, index) in projects" 
                :key="p.id"
                class="file-row"
                :class="{ 'selected': selectedIndex === index }"
                @click="selectProject(index)"
             >
                <span class="col-name">{{ p.name }}</span>
                <span class="col-type">{{ p.type }}</span>
                <span class="col-date">{{ p.date }}</span>
             </div>
             <!-- Empty rows filler -->
             <div class="file-row empty" v-for="n in 5" :key="'e'+n">
                <span class="col-name">~</span>
             </div>
          </div>
          <div class="pane-footer">
             {{ projects.length }} FILES(S)
          </div>
        </div>

        <!-- Right Pane: Viewer -->
        <div class="tui-pane right-pane" :class="{ 'active-pane': activePane === 'right' }">
          <div class="pane-header">
             <div class="pane-title"> VIEW: {{ projects[selectedIndex].name }} </div>
          </div>
          <div class="pane-content view-content" ref="viewContent">
             <pre>{{ projects[selectedIndex].description }}</pre>
          </div>
          <div class="pane-footer">
             READ-ONLY
          </div>
        </div>
      </div>

      <!-- Bottom Function Keys -->
      <div class="tui-footer">
        <div class="f-key" :class="{ active: activeKey === 'F1' }"><span>F1</span> HELP</div>
        <div class="f-key" :class="{ active: activeKey === 'F2' }"><span>F2</span> MENU</div>
        <div class="f-key" :class="{ active: activeKey === 'F3' }"><span>F3</span> VIEW</div>
        <div class="f-key" :class="{ active: activeKey === 'F4' }"><span>F4</span> EDIT</div>
        <div class="f-key" :class="{ active: activeKey === 'F5' }"><span>F5</span> COPY</div>
        <div class="f-key" :class="{ active: activeKey === 'F6' }"><span>F6</span> MOVE</div>
        <div class="f-key" :class="{ active: activeKey === 'F7' }"><span>F7</span> MKDIR</div>
        <div class="f-key" :class="{ active: activeKey === 'F8' }"><span>F8</span> DELETE</div>
        <div class="f-key" :class="{ active: activeKey === 'F9' }"><span>F9</span> PULLDN</div>
        <div class="f-key" :class="{ active: activeKey === 'F10' }"><span>F10</span> QUIT</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modern TUI Styles */
.tui-container {
  width: 100%;
  height: 100%; /* Fit parent section, not viewport */
  display: flex;
  flex-direction: column;
  padding: 0; /* Full bleed */
  background-color: transparent;
  font-family: var(--font-mono, monospace);
  color: #fff;
  box-sizing: border-box;
}

.tui-frame {
  width: 100%;
  height: 100%;
  max-width: none;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  box-shadow: none;
}

.tui-header {
  background: transparent;
  color: #fff;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-weight: bold;
  font-size: 1.5rem; /* Bigger header */
  border-bottom: 2px solid #fff;
  letter-spacing: 2px;
}

.tui-panes {
  flex: 1;
  display: flex;
  padding: 0;
  gap: 0; /* No gap, use border */
  overflow: hidden;
}

.tui-pane {
  flex: 1;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.left-pane {
  flex: 0.8; /* Slightly smaller list */
  border-right: 2px solid #fff;
  max-width: 40%;
}

.right-pane {
  flex: 1.2;
}

.pane-header {
  border-bottom: 1px solid #333; /* Subtle divider */
  padding: 10px 0;
  text-align: left;
  background: transparent;
  margin-bottom: 20px;
}

.pane-title {
    font-size: 1.2rem;
    opacity: 0.7;
}

.pane-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  font-size: 1.4rem; /* Bigger content font */
}

.custom-scroll {
    scrollbar-width: none; /* Clean look */
}
.custom-scroll::-webkit-scrollbar {
    display: none;
}

.pane-footer {
    border-top: 1px solid #333;
    padding: 10px 0;
    text-align: right;
    font-size: 1rem;
    opacity: 0.6;
}

/* File List Styles */
.column-headers {
    display: flex;
    padding: 10px 20px;
    border-bottom: 2px solid #fff;
    color: var(--color-accent);
    font-weight: bold;
    font-size: 1.2rem;
    letter-spacing: 1px;
}

.file-row {
    display: flex;
    padding: 15px 20px; /* More breathing room */
    cursor: pointer;
    transition: all 0.2s ease;
    /* border-bottom removed */
}

.file-row:hover {
    background: rgba(255, 255, 255, 0.05);
    padding-left: 25px; /* Slight movement */
}

.file-row.selected {
    background: #fff;
    color: #000;
    font-weight: bold;
    padding-left: 30px; /* Selected indent */
    animation: flashSelection 0.1s;
}

/* Accent color for selected row text override if needed */
.file-row.selected .col-name { color: #000; }
.file-row.selected .column-headers { color: #000; }

@keyframes flashSelection {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
}

.col-name { flex: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.col-type { flex: 0.5; opacity: 0.7; font-size: 0.9em; }
.col-date { flex: 0.8; text-align: right; opacity: 0.7; font-size: 0.9em; }

/* Viewer Styles */
.view-content {
    padding: 20px;
    line-height: 1.6;
}

pre {
    font-family: inherit;
    white-space: pre-wrap;
    margin: 0;
    font-size: 1.4rem; /* Matching big size */
}

/* Footer Keys */
.tui-footer {
    display: flex;
    padding: 20px 40px;
    gap: 15px; /* Reduced gap to fit all keys */
    justify-content: space-between; /* Spread evenly */
    border-top: 2px solid #fff;
    background: #000; /* Contrast stripe */
}

.f-key {
    background: transparent;
    color: #888;
    font-size: 1.1rem;
    cursor: pointer;
    transition: color 0.2s;
}

.f-key span {
    background: #333;
    color: #fff;
    border: none;
    padding: 2px 8px;
    margin-right: 8px;
    font-weight: bold;
}

.f-key:hover, .f-key.active {
    color: #fff;
}

.f-key:hover span, .f-key.active span {
    background: var(--color-accent);
    color: #000;
}

/* Active Pane Indicator */
.active-pane .pane-header {
    background: var(--color-accent);
    color: #000;
}

.active-pane .pane-title {
    opacity: 1;
    font-weight: bold;
}

/* Update default pane to have transparent border to prevent jump */
.tui-pane {
  flex: 1;
  border: 1px solid transparent; /* Placeholder for active state */
  display: flex;
  flex-direction: column;
  padding: 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.left-pane {
  flex: 0.8; 
  /* We previously had right border here, let's keep it but manage conflict with active border */
  border-right: 1px solid #fff; 
  max-width: 40%;
}


/* Mobile Responsive */
@media (max-width: 768px) {
    .tui-panes {
        flex-direction: column;
    }
    .left-pane {
        max-width: 100%;
        border-right: none;
        border-bottom: 2px solid #fff;
        flex: 1;
        max-height: 40vh;
    }
    .tui-header {
        font-size: 1.2rem;
        padding: 10px 20px;
    }
}
</style>
