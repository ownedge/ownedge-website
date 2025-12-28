<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../sfx/SoundManager';
// Use direct import for asset to get hashed URL
import bootVideoUrl from '../assets/ownedge.mp4';

const videoRef = ref(null);
const props = defineProps({
  isBooted: { type: Boolean, default: false }
});
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
  if (props.isBooted) return; // Ignore keys if already booted
  
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
  if (videoRef.value) {
      videoRef.value.playbackRate = 0.8;
  }

  window.addEventListener('keydown', handleKeydown);
  
  const steps = [
    { p: 10 },
    { p: 30 },
    { p: 50 },
    { p: 70 },
    { p: 96 },
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
        setTimeout(nextStep, Math.random() * 1100 + 50); 
      }
    }, 20); 
  }

  // Delay loading start to let keys appear first
  if (!props.isBooted) {
    setTimeout(nextStep, 1100);
  } else {
    // If somehow mounted already booted, ensure state is correct
    isReady.value = true;
  }
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
    <video ref="videoRef" class="boot-video" autoplay muted loop playsinline>
        <source :src="bootVideoUrl" type="video/mp4">
    </video>
    
    <template v-if="!isBooted">
      <div class="scanlines-overlay"></div>
      
      <!-- Interaction Layer (Invisible but captures Enter) -->
      <div class="interaction-layer"></div>
    </template>
  </div>
</template>

<style scoped>
.boot-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Lowest child level for background */
  overflow: hidden;
  /* Disable pointer events after boot to avoid blocking content */
  pointer-events: v-bind("isBooted ? 'none' : 'auto'");
}

.boot-video {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 101%;
    height: 101%;
    object-fit: cover;
    opacity: 0.26; /* Much darker */
    mix-blend-mode: color-burn;
    mix-blend-mode: color-burn;
    filter: grayscale(0.6) contrast(2.3); /* Less color, gritty contrast */
}

.scanlines-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 2px,
        rgba(0, 0, 0, 0.4) 3px,
        rgba(0, 0, 0, 0.4) 4px
    );
    pointer-events: none;
    z-index: 10;
    opacity: 0.9;
}

</style>
