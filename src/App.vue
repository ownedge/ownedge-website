<script setup>
import GridOverlay from './components/GridOverlay.vue'
import HeroDisplay from './components/HeroDisplay.vue'
import PortfolioTUI from './components/PortfolioTUI.vue'
import PhosphorOverlay from './components/PhosphorOverlay.vue'
import NoiseOverlay from './components/NoiseOverlay.vue'
import SoundManager from './utils/SoundManager'
import BootLoader from './components/BootLoader.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

let cursorInterval = null;

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Initialize to center to avoid initial jump/offset
const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)

const isCursorVisible = ref(false)
const isBooted = ref(false)
let hideCursorTimeout = null

const handleMouseMove = (e) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  
  // Show cursor on move
  isCursorVisible.value = true
  
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
  document.addEventListener('click', hideCursor);
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
    SoundManager.startChillLoop();
  }, SoundManager.config.MUSIC_START_DELAY);
  
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
  
  // Start glitch loop
  setTimeout(triggerGlitch, 5000);
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
const turbulenceFreq = ref(0.0001);

const triggerGlitch = () => {
    if (!isBooted.value) return;

    // Glitch sequence: Spike -> Recover -> Minor Spike -> Recover
    const spike = () => {
       turbulenceFreq.value = 0.0044 * Math.random();
       setTimeout(() => {
           turbulenceFreq.value = 0.0001; 
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



const heroStyle = computed(() => {
  const x = (mouseX.value - windowWidth.value / 2) * 0.005
  const y = (mouseY.value - windowHeight.value / 2) * 0.005
  return { transform: `translate(${-x}px, ${-y}px)` } // Inverse movement for depth
})
</script>

<template>
  <div class="crt-wrapper">
    
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
        
        <!-- Fixed Foreground Overlays -->
        <div class="scanlines"></div>
        <div class="vignette"></div>
      </div>
    </div>
    
    <!-- SVG Filter for Spherical Distortion -->
    <svg width="0" height="0" style="position: absolute; pointer-events: none;">
      <defs>
        <filter id="spherical-warp" x="-1%" y="-1%" width="104%" height="104%">
          <!-- Use low frequency turbulence to simulate broad warping/curvature -->
          <!-- Use low frequency turbulence to simulate broad warping/curvature -->
          <feTurbulence :baseFrequency="turbulenceFreq" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    
    <div 
      class="custom-cursor" 
      :style="{ 
        transform: `translate3d(${mouseX}px, ${mouseY}px, 0)`,
        opacity: isCursorVisible ? 0.8 : 0
      }"
    ></div>
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
  position: fixed;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background-image: url("data:image/svg+xml,%3Csvg width='34' height='34' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7841 12.3673H5.65376Z' fill='rgba(233, 18, 18, 0.6)'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 9999;
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
  padding: 10px; /* Bezel thickness */
  cursor: none; /* Ensure hidden here too */
}

/* CRT Screen (The curvature and clipping) */
.crt-screen {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 30px; /* More pronounced curve */
  position: relative;
  overflow: hidden;
  box-shadow: 
    inset 0 0 100px rgba(0,0,0,0.9), /* Internal tube shadow */
    0 0 20px rgba(0,0,0,0.5);
  transform: perspective(1000px); 
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #111; /* Bezel edge */
}

.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, #222 0%, #101010 100%);
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
    transparent 62%,
    #000 45%
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
  box-shadow: inset 0 0 110px rgba(0,0,0,0.5);
  border-radius: 10px;
}





</style>
