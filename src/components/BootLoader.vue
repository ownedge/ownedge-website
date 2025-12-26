<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../sfx/SoundManager';
import energyStarLogo from '../assets/energy-star-logo.png';

const emit = defineEmits(['start']);
const progress = ref(0);
const isReady = ref(false);
const showHint = ref(false); // New ref for immediate hint display
const loadingText = ref("INITIALIZING SYSTEM...");

const isLaunching = ref(false);
const activeKeys = ref({
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
});

const triggerLaunch = () => {
    if (isLaunching.value) return;
    isLaunching.value = true;
    setTimeout(() => {
        emit('start');
    }, 500);
}

const isEasterEggActive = ref(false);

const checkEasterEgg = () => {
    const k = activeKeys.value;
    if (k.ArrowUp && k.ArrowDown && k.ArrowLeft && k.ArrowRight) {
        if (!isEasterEggActive.value) {
            triggerEasterEgg();
        }
    }
}

const triggerEasterEgg = () => {
    isEasterEggActive.value = true;
    SoundManager.playSparkleSound();
    
    // Hide after 3 seconds
    setTimeout(() => {
        isEasterEggActive.value = false;
    }, 3000);
}

const handleKeydown = async (e) => {
  // Allow arrow keys visual feedback anytime
  if (activeKeys.value.hasOwnProperty(e.key)) {
    // Initialize sound on first interaction
    if (!SoundManager.initialized) SoundManager.init();
    if (SoundManager.ctx?.state === 'suspended') await SoundManager.resume();
    
    SoundManager.playTypingSound();
    activeKeys.value[e.key] = true;
    checkEasterEgg();
  }

  // Only allow Enter when system is ready
  if (isReady.value && e.key === 'Enter') {
    triggerLaunch();
  }
}

const handleKeyup = (e) => {
    if (activeKeys.value.hasOwnProperty(e.key)) {
        activeKeys.value[e.key] = false;
        // Optimization: No need to check on keyup as it only removes keys
    }
}

// Fake loading sequence
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);
  
  // Show hint immediately (will fade in via CSS)
  setTimeout(() => {
      showHint.value = true;
  }, 100);
  
  const steps = [
    { p: 10, t: "LOADING KERNEL..." },
    { p: 30, t: "INSTALLING DRIVERS..." },
    { p: 50, t: "BOOTING OPERATING SYSTEM..." },
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

  // Delay loading start to let keys appear first
  setTimeout(nextStep, 1500);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keyup', handleKeyup);
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
      
       <div class="keyboard-hint" :class="{ 'visible': showHint }">
           <div class="hint-visuals">

               <!-- Width/Height ratio adjusted for 3 columns x 2 rows of these big keys -->
               <div class="keyboard-group">
                   <svg class="keyboard-svg" width="180" height="120" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <defs>
                           <!-- The 'Key' shape the user liked (originally the keyboard body) -->
                           <g id="big-iso-key">
                               <!-- Preserving original path data but wrapped in group -->
                               <path d="M10 20 L50 40 L90 20 L50 0 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                               <path d="M10 20 L10 35 L50 55 L90 35 L90 20" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                               <path d="M50 55 L50 40" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                           </g>
                       </defs>

                       <!-- UP KEY (Centered on top row) -->
                       <g transform="translate(140, 30)">
                           <g class="key-inner" :class="{ active: activeKeys.ArrowUp }">
                               <use href="#big-iso-key" />
                               <!-- UP Arrow (Pointing North-East) -->
                               <path d="M40 25 L60 15" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                               <path d="M50 14 L60 15 L56 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                           </g>
                       </g>

                       <!-- LEFT KEY (Bottom row left) -->
                       <g transform="translate(40, 40)">
                           <g class="key-inner" :class="{ active: activeKeys.ArrowLeft }">
                               <use href="#big-iso-key" />
                               <!-- LEFT Arrow (Pointing North-West) -->
                               <path d="M60 25 L40 15" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                               <path d="M50 14 L40 15 L44 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                           </g>
                       </g>

                       <!-- DOWN KEY (Bottom row center) -->
                       <g transform="translate(90, 65)">
                           <g class="key-inner" :class="{ active: activeKeys.ArrowDown }">
                               <use href="#big-iso-key" />
                               <!-- DOWN Arrow (Pointing South-West) -->
                               <path d="M60 15 L40 25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                               <path d="M50 26 L40 25 L44 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                           </g>
                       </g>

                       <!-- RIGHT KEY (Bottom row right) -->
                       <g transform="translate(140, 90)">
                           <g class="key-inner" :class="{ active: activeKeys.ArrowRight }">
                               <use href="#big-iso-key" />
                               <!-- RIGHT Arrow (Pointing South-East) -->
                               <path d="M40 15 L60 25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                               <path d="M50 26 L60 25 L56 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                           </g>
                       </g>
                   </svg>
                   <div class="hint-text">▶ KEYBOARD FRIENDLY</div>
               </div>
           </div>
       </div>

       <!-- ENERGY STAR EASTER EGG OVERLAY -->
       <div class="energy-star-overlay" v-if="isEasterEggActive">
            <img :src="energyStarLogo" class="energy-star-easter-egg" alt="Energy Star" />
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
  background-color: transparent;
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
  border: 0px solid #333;
  padding: 40px;
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

.keyboard-hint {
    position: absolute;
    bottom: 40px;
    left: 0;
    width: 100%;
    text-align: center;
    color: #fff;
    opacity: 0;
    pointer-events: none;
    transition: opacity 1.5s ease-out; /* Immediate fade in */
    display: flex;
    justify-content: center;
}

.hint-visuals {
    display: flex;
    align-items: flex-end;
    gap: 40px;
}

.speaker-group, .keyboard-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.speaker-svg {
    stroke: var(--color-accent, #fff);
    filter: drop-shadow(0 0 3px var(--color-accent, #fff));
    margin-bottom: 5px;
}

.keyboard-hint.visible {
    opacity: 0.6;
}

.hint-text {
    font-size: 0.9rem;
    letter-spacing: 2px;
    opacity: 0.8;
}

.keyboard-svg {
    stroke: var(--color-accent, #fff);
    width: 180px; /* Increased to maintain visual size of keys */
    height: auto;
    filter: drop-shadow(0 0 5px var(--color-accent, #fff));
    margin-bottom: 0px; /* Removed bottom margin */
    overflow: visible; /* Ensure globs don't clip */
}

/* Active state: Fill the path inside the "use" shadow DOM equivalent or targeted group */
.key-inner {
    transition: transform 0.1s;
    transform-origin: center;
}

.key-inner.active {
    transform: translateY(5px); /* Slight press down effect */
}

.key-inner.active use {
    fill: var(--color-accent, #fff);
    fill-opacity: 0.2;
}

.energy-star-easter-egg {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 250px;
    height: auto;
    filter: drop-shadow(0 0 5px var(--color-accent, #fff));
    animation: fadeInOutLogo 3s ease-in-out;
}

@keyframes fadeInOutLogo {
    0% { 
        opacity: 0;
        transform: translateY(-10px);
    }
    10% { 
        opacity: 0.75; /* Match desired opacity */
        transform: translateY(0);
    }
    90% {
        opacity: 0.75; /* Match desired opacity */
        transform: translateY(0);
    }
    100% { 
        opacity: 0;
        transform: translateY(-10px);
    }
}
</style>
