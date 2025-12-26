<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import SoundManager from '../sfx/SoundManager';
// import sonyLogo from '../assets/sony-logo.png'; // No longer used, handled by CSS text

const props = defineProps({
  mode: {
    type: String,
    default: 'spectrum' // 'off', 'logo', 'spectrum', 'knob'
  },
  knobInfo: {
    type: Object,
    default: () => ({ label: '', value: '' })
  },
  bootState: {
    type: String, 
    default: 'complete' // 'loading', 'ready', 'complete'
  },
  bootProgress: {
    type: Number,
    default: 0
  },
  scanlineColor: {
    type: String,
    default: 'rgba(0,0,0,0.9)'
  }
});

const vfdCanvas = ref(null);
const readyTimestamp = ref(0);
let animationFrameId = null;

watch(() => props.bootState, (newState) => {
    if (newState === 'ready') {
        readyTimestamp.value = Date.now();
    }
    // ensure loop runs
    startSpectrumAnalyzer();
});

const startSpectrumAnalyzer = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const draw = () => {
        // Handle Boot States Override (Highest Priority)
        // If bootState is NOT complete, we hijacked the display for the loading bar
        if (props.bootState !== 'complete') {
             if (!vfdCanvas.value) {
                 animationFrameId = requestAnimationFrame(draw);
                 return;
             }
             const canvas = vfdCanvas.value;
             const ctx = canvas.getContext('2d');
             
             // Ensure size
             if (canvas.width !== 185) { canvas.width = 185; canvas.height = 36; }
             
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.fillStyle = '#40e0d0';

             if (props.bootState === 'loading') {
                 // Draw Progress Bar - 95% width
                 const width = canvas.width * 0.95;
                 const x = (canvas.width - width) / 2;
                 const height = 32; // Taller bar
                 const y = (canvas.height - height) / 2;
                 
                 // Fill - Map accurately 0-100%
                 const fillWidth = width * (Math.min(props.bootProgress, 100) / 100);
                 
                 if (fillWidth > 0) ctx.fillRect(x, y, fillWidth, height);
                 
             } else if (props.bootState === 'ready') {
                 // 1. Draw Full Solid Bar (The "100%" state)
                 const width = canvas.width * 0.95;
                 const x = (canvas.width - width) / 2;
                 const height = 32; // Taller bar
                 const y = (canvas.height - height) / 2;
                 
                 ctx.fillStyle = '#40e0d0';
                 ctx.fillRect(x, y, width, height);

                 // 2. Draw Inverted Text (Cutout)
                 const now = Date.now();
                 const elapsed = now - readyTimestamp.value;
                 const blinkDuration = 25; // ms per phase
                 const blinkCount = 3;
                 
                 let showText = true;
                 
                 if (elapsed < (blinkCount * 2 * blinkDuration)) {
                     // Inside blink window
                     const phase = Math.floor(elapsed / blinkDuration);
                     if (phase % 2 !== 0) showText = false; // OFF on odd phases
                 }
                 // Else: showText remains true (Stay Visible)

                 if (showText) {
                     ctx.globalCompositeOperation = 'destination-out'; // This erases pixels!
                     ctx.font = "bold 28px 'Microgramma'";
                     ctx.textAlign = 'center';
                     ctx.textBaseline = 'middle';
                     // No shadow for cutout, just pure erase
                     ctx.fillText(" ENTER ↵", canvas.width / 2, canvas.height / 2);
                     ctx.globalCompositeOperation = 'source-over'; // Restore default
                 }
             }
             
             animationFrameId = requestAnimationFrame(draw);
             return;
        }

        // Normal Operation: Spectrum Analyzer
        if (props.mode !== 'spectrum') return;
        
        if (!vfdCanvas.value) {
             animationFrameId = requestAnimationFrame(draw);
             return;
        }

        const canvas = vfdCanvas.value;
        const ctx = canvas.getContext('2d');
        
        if (canvas.width !== 185) {
            canvas.width = 185;
            canvas.height = 36;
        }

        const data = SoundManager.getAudioData();
        
        if (!data) {
             animationFrameId = requestAnimationFrame(draw);
             return;
        }

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dot Matrix Config
        // 185px width, 36px height at 100% zoom (approx)
        const dotSize = 0.5;
        const gap = 0; 
        const step = dotSize + gap;
        const cols = Math.floor(canvas.width / step);
        const rows = Math.floor(canvas.height / step);
        
        ctx.fillStyle = '#40e0d0'; // Teal VFD color

        // Draw Visualization
        for (let i = 0; i < cols; i++) {
            // Map freq bin to column
            const binIndex = Math.floor((i / cols) * data.length * 0.5); 
            const value = data[binIndex] || 0; // 0-255
            
            // Calculate active dots for this column
            const heightPercent = value / 255;
            const activeDots = Math.floor(heightPercent * rows);
            
            for (let j = 0; j < rows; j++) {
                // Draw from bottom up
                if (j < activeDots) {
                    // Invert Y to draw from bottom
                    const y = canvas.height - (j * step) - dotSize;
                    const x = i * step;
                    
                    // Opacity falloff for "glow"
                    ctx.globalAlpha = 0.8 + (value / 1200); 
                    ctx.fillRect(x, y, dotSize, dotSize);
                }
            }
        }
        
        animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
};

// Lifecycle
onMounted(() => {
    startSpectrumAnalyzer();
});

onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

// Reactivity
watch(() => props.mode, (newMode) => {
    if (newMode === 'spectrum') {
        startSpectrumAnalyzer();
    } else {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
});

// Also watch bootState - if it becomes spectrum-relevant (e.g., switches out of boot), restart
// (Note: The specific watch above handles the 'ready' timestamp logic, this global one ensures loop continuity)
// Merged into the specific watch above to avoid duplication, or can keep generic logic here.
// Actually, let's remove the duplicate watch to be clean.

</script>

<template>
    <div class="vfd-display">
       <div class="vfd-overlay"></div> <!-- Dot Matrix Grid Mask -->
       
       <!-- WELCOME Animation -->
       <Transition name="vfd-anim" mode="out-in">
           <div v-if="mode === 'logo'" class="vfd-logo-container">
               <span class="vfd-welcome-text">WELCOME</span>
           </div>
           
           <div v-else-if="mode === 'knob'" class="vfd-info-container">
               <span class="vfd-label">{{ knobInfo.label }}</span>
               <span class="vfd-value">{{ knobInfo.value }}</span>
           </div>
    
           <!-- Spectrum Analyzer OR Loading Bar (Both use Canvas) -->
           <!-- logic for showing canvas: if mode is spectrum OR if boot isn't complete (loading/ready) -->
           <canvas 
            v-else-if="mode === 'spectrum' || bootState !== 'complete'" 
            ref="vfdCanvas" 
            class="vfd-canvas"
            ></canvas>
       </Transition>
    </div>
</template>

<style scoped>
/* VFD Display Container */
.vfd-display {
    background-color: #000;
    margin: 0; 
    border-bottom: 1px solid #222;
    padding: 4px; 
    border-radius: 4px; /* Slightly more rounded */
    box-shadow: 
        inset 0 2px 10px rgba(0,0,0,1), /* Stronger top inner shadow */
        inset 0 0 5px rgba(0,0,0,0.8),
        0 1px 0 rgba(255, 255, 255, 0.05); /* Subtle lip */
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 185px; /* Wider (120%) */
    height: 44px;
    overflow: hidden; 
    position: relative;
    
    /* Simulate slight curve/recess */
    background-image: linear-gradient(to bottom, #000 0%, #080a08 20%, #080a08 80%, #000 100%);
}

/* Glass & Dot Grid Effect */
.vfd-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Create a 'mask' of black with transparent holes */
  background: radial-gradient(
    circle,
    transparent 2%,
    v-bind(scanlineColor) 95%
  );
  background-size: 2px 2px; /* Dot density */
  pointer-events: none;
  z-index: 50;
  opacity: 0.9;
}

.vfd-logo-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.vfd-welcome-text {
    font-family: 'Microgramma'; /* Sony-like Slab Serif */
    color: #40e0d0;
    font-size: 1.6rem;
    letter-spacing: 1px; /* Tighter tracking for Sony look */
    font-weight: 900; /* Extra bold */
    text-shadow: 0 0 8px #40e0d0, 0 0 15px rgba(64, 224, 208, 0.4);
    opacity: 0.9;
    animation: text-flicker 3s infinite;
}

@keyframes text-flicker {
    0% { opacity: 0.9; }
    3% { opacity: 0.8; }
    6% { opacity: 0.9; }
    7% { opacity: 0.4; }
    8% { opacity: 0.9; }
    9% { opacity: 0.95; }
    10% { opacity: 0.1; }
    11% { opacity: 0.9; }
    100% { opacity: 0.9; }
}

.vfd-canvas {
    width: 100%;
    height: 100%;
    image-rendering: pixelated; 
    opacity: 0.9;
}

/* VFD Transitions */
.vfd-anim-enter-active {
  transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
}

.vfd-anim-leave-active {
  transition: all 0.5s cubic-bezier(0.5, 0, 0.8, 0.2);
}

/* Special Exit for Logo Container (WELCOME text) */
.vfd-anim-leave-active .vfd-welcome-text {
    animation: text-warp-out 0.5s forwards;
}

@keyframes text-warp-out {
    0% { 
        transform: scaleX(1) translateX(0); 
        opacity: 0.9;
        filter: blur(0px);
    }
    10% {
        transform: scaleX(1.5) translateX(5px);
        opacity: 1;
        color: #fff; /* Flash white */
        filter: blur(1px);
    }
    40% {
        transform: scaleX(4) translateX(20px); /* Stretch */
        opacity: 0.5;
        filter: blur(2px);
        letter-spacing: 20px; /* Explode letters */
    }
    100% { 
        transform: scaleX(10) translateX(50px); 
        opacity: 0;
        filter: blur(10px);
        letter-spacing: 50px; 
    }
}

.vfd-anim-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.vfd-anim-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.vfd-info-container {
    width: 100%;
    height: 100%;
    position: relative; 
    display: flex;
    align-items: center; 
    justify-content: space-between; /* Spread items */
    padding: 0 12px; /* Balanced padding */
}

.vfd-label {
    /* position: absolute; Removed for flex centering */
    /* top: 2px; */
    /* left: 8px; */
    font-family: 'Microgramma', monospace; 
    color: #40e0d0;
    font-size: 0.9rem; /* Tiny label */
    letter-spacing: 1px;
    font-weight: bold;
    text-shadow: 0 0 5px #40e0d0;
    opacity: 0.8;
}

.vfd-value {
    font-family: 'Microgramma', monospace; 
    color: #40e0d0;
    font-size: 1.8rem; /* Large Value */
    letter-spacing: 2px;
    font-weight: bold;
    text-shadow: 0 0 8px #40e0d0;
    text-shadow: 0 0 8px #40e0d0;
    line-height: 1;
    margin-top: 4px; /* Slight optical adjustment */
}
</style>
