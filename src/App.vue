<script setup>
import GridOverlay from './components/GridOverlay.vue'
import HeroDisplay from './components/HeroDisplay.vue'
import PortfolioTUI from './components/PortfolioTUI.vue'
import PhosphorOverlay from './components/PhosphorOverlay.vue'
import NoiseOverlay from './components/NoiseOverlay.vue'
import SoundManager from './sfx/SoundManager'
import BootLoader from './components/BootLoader.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import sonyLogo from './assets/sony-logo.png' // Import logo

let cursorInterval = null;

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Initialize to center to avoid initial jump/offset
// Initialize to center to avoid initial jump/offset
const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)

const isCursorVisible = ref(false)
const isBooted = ref(false)
let hideCursorTimeout = null
const screenRect = ref(null); // Cache for performance

const updateScreenRect = () => {
    const el = document.querySelector('.app-container');
    if (el) {
        screenRect.value = el.getBoundingClientRect();
    }
};

const handleMouseMove = (e) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  
  // Update rect if missing (lazy init)
  if (!screenRect.value) updateScreenRect();

  // Check bounds: Only show if inside the screen container
  if (screenRect.value) {
      const isInside = (
          e.clientX >= screenRect.value.left && 
          e.clientX <= screenRect.value.right &&
          e.clientY >= screenRect.value.top && 
          e.clientY <= screenRect.value.bottom
      );
      isCursorVisible.value = isInside;
  } else {
      isCursorVisible.value = true; // Fallback
  }
  
  // Brute-force hide OS cursor on every move to fight MacOS persistence
  if (document.body.style.cursor !== 'none') {
      hideCursor();
  }
  
  // Reset timer to hide
  clearTimeout(hideCursorTimeout)
  hideCursorTimeout = setTimeout(() => {
    isCursorVisible.value = false
  }, 2000)
}

const hideCursor = () => {
  const transparentCursor = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='), none";
  if (document.body.style.cursor !== transparentCursor) {
      document.body.style.cursor = transparentCursor;
      document.documentElement.style.cursor = transparentCursor;
  }
};

const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
    updateScreenRect();
}


const isCapsLock = ref(false);
const isTurbo = ref(true); // Always fast!
const isHddActive = ref(false);

const updateLockStates = (e) => {
  if (e.getModifierState) {
    isCapsLock.value = e.getModifierState('CapsLock');
  }
};

const simulateHddActivity = () => {
    // Random bursts of activity
    if (Math.random() > 0.7) {
        isHddActive.value = true;
        SoundManager.playHddSound();
        setTimeout(() => { isHddActive.value = false }, 50 + Math.random() * 100);
    }
    // Schedule next check
    setTimeout(simulateHddActivity, 50 + Math.random() * 200);
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', handleResize)
  
  // Aggressively hide cursor
  hideCursor();
  cursorInterval = setInterval(hideCursor, 500);

  // Re-hide on focus/entry (fixes Alt-Tab issue)
  window.addEventListener('focus', hideCursor);
  document.addEventListener('mouseenter', hideCursor);
  document.addEventListener('click', hideCursor);

  // Monitor Lock States
  window.addEventListener('keydown', updateLockStates);
  window.addEventListener('keyup', updateLockStates);
  window.addEventListener('mousedown', updateLockStates);
  window.addEventListener('mousemove', updateLockStates); 
  
  simulateHddActivity();
})

const handleGlobalHover = (e) => {
  // Check if target is interactive
  if (e.target.matches('button, a, input, [role="button"]')) {
     SoundManager.playHoverSound();
  }
}

const handleBootStart = async () => {
  // 1. Initialize Audio (User gesture is the click on "GO!")
  if (!SoundManager.initialized) SoundManager.init();
  if (SoundManager.ctx.state === 'suspended') await SoundManager.resume();
  
  // 2. Play Boot Sound
  SoundManager.playBootSequence();

  // 3. Start Chill Loop
  setTimeout(() => {
    SoundManager.startMusicRotation();
  }, 4500); // Wait for boot sound to finish
  
  // 4. Reveal Content
  isBooted.value = true;
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', handleResize)

  // Aggressively hide cursor
  hideCursor();
  cursorInterval = setInterval(hideCursor, 500);

  // Re-hide on focus/entry (fixes Alt-Tab issue)
  window.addEventListener('focus', hideCursor);
  document.addEventListener('mouseenter', hideCursor);
  
  document.addEventListener('mouseover', handleGlobalHover);
  window.addEventListener('keydown', handleGlobalKeydown);

  // Start glitch loop immediately
  triggerGlitch();
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('focus', hideCursor)
  document.removeEventListener('mouseenter', hideCursor)
  
  document.removeEventListener('click', hideCursor) // Remove old ref if needed, but handled by handleGlobalClick now
  document.removeEventListener('mouseover', handleGlobalHover);
  window.removeEventListener('keydown', handleGlobalKeydown);
  
  clearInterval(cursorInterval)
})

const handleGlobalKeydown = (e) => {
  if (!isBooted.value) return;

  // Check if we are currently at the top (Hero section)
  const scrollContainer = document.querySelector('.scroll-content');
  if (!scrollContainer) return;

  const isAtTop = scrollContainer.scrollTop < window.innerHeight / 2;

  if (isAtTop && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      // Scroll to next section (Portfolio)
      const sections = document.querySelectorAll('.page-section');
      if (sections.length > 1) {
          sections[1].scrollIntoView({ behavior: 'smooth' });
      }
  }
}

// Glitch Effect
const turbulenceFreq = ref(0.0002);

const triggerGlitch = () => {
    // Removed isBooted check to allow glitching during load

    // Glitch sequence: Spike -> Recover -> Minor Spike -> Recover
    const spike = () => {
       turbulenceFreq.value = 0.0044 * Math.random();
       setTimeout(() => {
           turbulenceFreq.value = 0.0002; 
       }, 50 + Math.random() * 100);
    };

    spike();
    
    // Occasionally double glith
    if (Math.random() > 0.5) {
        setTimeout(spike, 150);
    }
    
    // Schedule next glitch
    setTimeout(triggerGlitch, Math.random() * 8000 + 2000); 
};

const cursorStyle = computed(() => {
    // If no screen rect yet, hide or stick to 0,0
    if (!screenRect.value) return { opacity: 0 };
    
    // Relative coordinates
    const left = screenRect.value.left || 0;
    const top = screenRect.value.top || 0;
    const x = mouseX.value - left;
    const y = mouseY.value - top;
    
    return {
        transform: `translate3d(${x}px, ${y}px, 0)`,
        opacity: isCursorVisible.value ? 0.8 : 0
    };
});

const heroStyle = computed(() => {
  const x = (mouseX.value - windowWidth.value / 2) * 0.005
  const y = (mouseY.value - windowHeight.value / 2) * 0.005
  return { transform: `translate(${-x}px, ${-y}px)` } // Inverse movement for depth
})
</script>

<template>
  <div class="crt-wrapper">
    
    <!-- Fixed Status LEDs -->
    <div class="led-panel">
        <div class="led-group">
            <div class="led active-caps" :class="{ active: isCapsLock }"></div>
            <span class="led-label">CAPS</span>
        </div>
        <div class="led-group">
            <div class="led hdd-led" :class="{ active: isHddActive }"></div>
            <span class="led-label">DISK</span>
        </div>
        <div class="led-group">
            <div class="led turbo-led" :class="{ active: isTurbo }"></div>
            <span class="led-label">TURBO</span>
        </div>
    </div>

    <!-- Power LED (Right Side) -->
    <div class="power-panel">
        <div class="led-group">
            <div class="led power-led active"></div>
            <span class="led-label">POWER</span>
        </div>
    </div>

    <!-- Monitor Brand Logo (Image) -->
    <img :src="sonyLogo" class="monitor-brand" alt="SONY" />

    <div class="crt-screen">
      <!-- Apply 'crt-content' class for filter -->
      <!-- Apply 'crt-content' class for filter -->
      <div class="app-container">
        <!-- Fixed Background/Overlays -->
        <NoiseOverlay />
        
        <BootLoader v-if="!isBooted" @start="handleBootStart" />

        <div class="fixed-background">
            <GridOverlay />
        </div>

        <!-- Scrollable Content -->
        <div class="scroll-content" v-if="isBooted">
          <section class="page-section hero-section" :style="heroStyle">
            <HeroDisplay />
          </section>
          
          <section class="page-section">
            <PortfolioTUI />
          </section>
        </div>
        
        <!-- Phosphor Burn Layer (simulates screen persistence) -->
        <PhosphorOverlay />
        
        <!-- Synthetic Cursor (Inside screen, behind effects) -->
        <div 
          class="custom-cursor" 
          :style="cursorStyle"
        ></div>

        <!-- Fixed Foreground Overlays -->
        <div class="scanlines"></div>
        <div class="vignette"></div>
      </div>
    </div>
    
    <!-- SVG Filter for Glitch/Distortion (Efficient) -->
    <svg width="0" height="0" style="position: absolute; pointer-events: none;">
      <defs>
        <filter id="spherical-warp" x="-10%" y="-10%" width="200%" height="200%">
          <!-- Simple Turbulence for Glitch Effect -->
          <feTurbulence :baseFrequency="turbulenceFreq" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  </div>
</template>

<style>
/* Global cursor hide using Transparent Image Trick */
/* This is more robust than 'none' as it tricks the OS into showing a valid (but invisible) cursor */
html, body, .crt-wrapper, * {
  cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='), none !important;
}
</style>

<style scoped>
/* Custom Cursor Element */
/* Custom Cursor Element */
.custom-cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background-image: url("data:image/svg+xml,%3Csvg width='34' height='34' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7841 12.3673H5.65376Z' fill='rgba(233, 18, 18, 0.6)'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 45; /* Below Scanlines (50) and Vignette (60) */
  /* Adjust transform to align tip of arrow */
  transform: translate(0, 0); 
  mix-blend-mode: normal; 
  will-change: transform;
  /* Add a drop shadow for glowing effect */
  filter: drop-shadow(0 0 5px rgba(233, 18, 18, 0.8));
  /* opacity controlled by JS */
  transition: opacity 0.5s ease;
}

/* CRT Wrapper (The Bezel/Room) */
.crt-wrapper {
  width: 100vw;
  height: 100vh;
  background-color: #050505;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 30px 80px 30px; /* Thicker chin */
  cursor: none; /* Ensure hidden here too */
}

/* CRT Screen (The curvature and clipping) */
.crt-screen {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 40px; /* Slight curve at corners */
  position: relative;
  overflow: hidden;
  /* Strong inner shadow to simulate curved glass depth */
  box-shadow: 
    inset 0 0 80px rgba(0,0,0,0.9), 
    0 0 90px rgba(100, 100, 100, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 12px solid #1d1d1d; 
}

.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, #181818 0%, #000000 100%);
  overflow: hidden; /* Container is fixed window */
  filter: url(#spherical-warp); /* Apply content distortion */
}

/* Fixed Background Layer */
.fixed-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

/* Scroll Content - This is the moving part */
.scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto; /* Enable scrolling internal to this div */
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  z-index: 20; /* Above background but below overlays */
  
  /* Hide scrollbar */
  scrollbar-width: none;
}

.scroll-content::-webkit-scrollbar {
  display: none;
}

/* Page Sections */
.page-section {
  height: 100%; /* Fit the scroll-content container exactly */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: start;
  position: relative;
}

.hero-section {
  /* Apply parallax transform here if needed, or keep passing it */
  transition: transform 0.1s ease-out;
}

/* Scanlines / Dot Matrix Mask */
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Create a 'mask' of black with transparent holes */
  background: radial-gradient(
    circle,
    transparent 43%,
    rgb(20, 52, 57) 95%
  );
  background-size: 2.5px 2.5px; /* Dot density */
  pointer-events: none;
  z-index: 50;
  opacity: 0.9;
}

/* Vignette / Tube Curvature Simulation */
.vignette {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 60;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.9);
  border-radius: 5px;
}

/* LED Status Panel */
.led-panel {
    position: fixed;
    bottom: 1.5rem; /* Sit in the bottom bezel padding */
    left: 4rem;
    display: flex;
    gap: 1.5rem;
    pointer-events: none;
    z-index: 10000;
}

.led-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    width: 60px; /* Enforce overlapping width to keep centers equidistant */
}

.led {
    width: 20px;
    height: 8px;
    background-color: #0b1d0b;
    border: 1px solid #142e14;
    box-shadow: inset 0 0 2px rgba(0,0,0,0.8);
    transition: all 0.1s ease;
}

/* CAPS (Standard Green) */
.active-caps.active {
    background-color: #33ff33;
    box-shadow: 0 0 5px #33ff33, 0 0 10px #33ff33, 0 0 40px rgba(51, 255, 51, 0.4), inset 0 0 1px rgba(255,255,255,0.5);
    border-color: #55ff55;
    z-index: 10002;
}

/* HDD (Amber/Orange) */
.hdd-led {
    background-color: #3b2400; /* Dark Amber (Off) */
    border-color: #553300;
}

.hdd-led.active {
    background-color: #ffaa00;
    box-shadow: 0 0 5px #ffaa00, 0 0 10px #ffaa00, 0 0 40px rgba(255, 170, 0, 0.4), inset 0 0 1px rgba(255,255,255,0.5);
    border-color: #ffcc00;
    z-index: 10002;
}

.led-group:has(.hdd-led.active) .led-label {
    text-shadow: -1px -1px 0px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 170, 0, 0.5);
    color: #776644;
}

/* TURBO (Yellow) */
.turbo-led {
    background-color: #3b3b00; /* Dark Yellow (Off) */
    border-color: #555500;
}

.turbo-led.active {
    background-color: #ffff00;
    box-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00, 0 0 40px rgba(255, 255, 0, 0.4), inset 0 0 1px rgba(255,255,255,0.5);
    border-color: #ffff88;
    z-index: 10002;
}

.led-group:has(.turbo-led.active) .led-label {
    text-shadow: -1px -1px 0px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 255, 0, 0.5);
    color: #777744;
}

/* Power LED Specifics */

.led-label {
    font-family: 'MicrogrammaDMedExt', 'Courier New', monospace;
    font-size: 0.6rem;
    color: #444; 
    letter-spacing: 1px;
    font-weight: bold;
    text-shadow: -1px -1px 0px rgba(0, 0, 0, 0.9);
    transition: all 0.2s ease;
}

/* Simulate light spilling onto the engraved text */
.led-group:has(.led.active) .led-label {
    text-shadow: 
        -1px -1px 0px rgba(0, 0, 0, 0.9),
        0 0 15px rgba(51, 255, 51, 0.5); /* Green wash */
    color: #667766; /* Tinted by green light */
}

/* Power LED Specifics */
.power-panel {
    position: fixed;
    bottom: 1.5rem;
    right: 4rem;
    display: flex;
    pointer-events: none;
    z-index: 10000;
}

.power-led.active {
    background-color: #33ff33; 
    box-shadow: 
        0 0 5px #33ff33,
        0 0 10px #33ff33,
        0 0 40px rgba(51, 255, 51, 0.4), /* Green Spill */
        inset 0 0 1px rgba(255,255,255,0.5);
    border-color: #55ff55;
}

.power-panel .led-group:has(.power-led.active) .led-label {
    text-shadow: 
        -1px -1px 0px rgba(0, 0, 0, 0.9),
        0 0 15px rgba(51, 255, 51, 0.5); /* Green wash */
    color: #667766; /* Tinted by green light */
}

/* Monitor Brand Styling */
.monitor-brand {
    position: absolute;
    bottom: 30px; /* Adjust for image height */
    left: 50%;
    transform: translateX(-50%);
    width: 95px; /* Realistic size for a bezel logo */
    height: 20px;
    opacity: 0.09; /* Printed label look */
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.2)); /* Slight bevel highlight */
    -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,1), rgba(0,0,0,0.9));
    mask-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,1), rgba(0,0,0,0.9));
    pointer-events: none;
    z-index: 10001;
}

</style>
