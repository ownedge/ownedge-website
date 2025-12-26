<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../sfx/SoundManager';
// Use direct import for asset to get hashed URL
import bootVideoUrl from '../assets/test-ownedge.mp4';

const emit = defineEmits(['start', 'progress', 'ready']);
const progress = ref(0);
const isReady = ref(false);

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

const handleKeydown = async (e) => {
  // Allow arrow keys visual feedback anytime
  if (activeKeys.value.hasOwnProperty(e.key)) {
    // Initialize sound on first interaction
    if (!SoundManager.initialized) SoundManager.init();
    if (SoundManager.ctx?.state === 'suspended') await SoundManager.resume();
    
    SoundManager.playTypingSound();
    activeKeys.value[e.key] = true;
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
  
  const steps = [
    { p: 10 },
    { p: 30 },
    { p: 50 },
    { p: 100 }
  ];

  let currentStep = 0;

  const nextStep = () => {
    if (currentStep >= steps.length) {
      isReady.value = true;
      emit('ready'); // Tell parent we are done
      return;
    }

    const { p } = steps[currentStep];
    
    // Animate progress to target
    const interval = setInterval(() => {
      if (progress.value < p) {
        progress.value += 4;
        emit('progress', progress.value); // Report to parent (VFD)
      } else {
        clearInterval(interval);
        currentStep++;
        setTimeout(nextStep, Math.random() * 200 + 50); 
      }
    }, 20); 
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
    <video class="boot-video" autoplay muted loop playsinline>
        <source :src="bootVideoUrl" type="video/mp4">
    </video>
    
    <!-- Interaction Layer (Invisible but captures Enter) -->
    <div class="interaction-layer"></div>
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
  background-color: #000;
  overflow: hidden;
}

.boot-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4; /* Much darker */
    mix-blend-mode: screen; 
    filter: grayscale(0.7) contrast(1.2); /* Less color, gritty contrast */
}
</style>
