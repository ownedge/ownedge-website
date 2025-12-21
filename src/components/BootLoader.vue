<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['start']);
const progress = ref(0);
const isReady = ref(false);
const loadingText = ref("INITIALIZING SYSTEM...");

const isLaunching = ref(false);

const triggerLaunch = () => {
    if (isLaunching.value) return;
    isLaunching.value = true;
    setTimeout(() => {
        emit('start');
    }, 500);
}

const handleKeydown = (e) => {
  if (isReady.value && e.key === 'Enter') {
    triggerLaunch();
  }
}

// Fake loading sequence
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  
  const steps = [
    { p: 10, t: "LOADING KERNEL..." },
    { p: 30, t: "VERIFYING ENCRYPTION..." },
    { p: 45, t: "MOUNTING VOLUMES..." },
    { p: 70, t: "CALIBRATING PHOSPHORS..." },
    { p: 90, t: "SYNCHRONIZING AUDIO..." },
    { p: 100, t: "SYSTEM READY." }
  ];

  let currentStep = 0;

  const nextStep = () => {
    if (currentStep >= steps.length) {
      isReady.value = true;
      return;
    }

    const { p, t } = steps[currentStep];
    
    // Animate progress to target
    const interval = setInterval(() => {
      if (progress.value < p) {
        progress.value += 4; // Much faster fill
      } else {
        clearInterval(interval);
        loadingText.value = t;
        currentStep++;
        setTimeout(nextStep, Math.random() * 200 + 50); // Shorter delays
      }
    }, 20); // Speed of filling
  }

  setTimeout(nextStep, 500);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const handleStart = () => {
  triggerLaunch();
};
</script>

<template>
  <div class="boot-loader">
    <div class="terminal-window">
      <div class="header">
        <span class="status">STATUS: {{ isReady ? 'ONLINE' : 'BOOTING' }}</span>
        <span class="id">ID: 8086-CPU</span>
      </div>
      
      <div class="content">
        <div class="loading-bar-container">
          <div class="loading-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="percentage">{{ progress }}%</div>
        <div class="log-text">> {{ loadingText }}<span class="cursor">_</span></div>
      </div>

      <div class="actions" :class="{ 'visible': isReady }">
        <button class="btn-go" :class="{'launching': isLaunching}" @click="handleStart">
             ENTER  ↵  
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boot-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
  background-color: #050505;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-main);
  color: #fff;
  font-size: 1.5rem; /* Scaled up more */
}

.terminal-window {
  width: 90%;
  max-width: 600px;
  border: 1px solid #333;
  padding: 40px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  background: rgba(10, 10, 10, 0.95);
}

.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 1.2rem; /* Bigger header */
  opacity: 0.7;
}

.loading-bar-container {
  width: 100%;
  height: 30px; /* Thicker bar */
  border: 1px solid #fff;
  padding: 2px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.loading-bar {
  height: 100%;
  background-color: #fff;
  width: 0%;
  /* No transition for stepped look */
}

.percentage {
  text-align: right;
  margin-bottom: 10px;
}

.log-text {
  font-size: 1.3rem;
  margin-bottom: 30px;
  min-height: 1.2em;
}

.cursor {
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.actions {
  display: flex;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transform: translateY(10px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.actions.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.btn-go {
  background: transparent;
  border: 2px solid #fff; /* Thicker border */
  color: #fff;
  padding: 15px 40px; /* Bigger button */
  font-family: inherit;
  font-size: 2rem; /* Bigger text */
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  font-weight: bold;
  letter-spacing: 4px;
}

.btn-go:hover, .btn-go.launching {
  background: #fff;
  color: #000;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
}

.btn-go.launching {
  transform: scale(0.98);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
