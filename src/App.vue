<script setup>
import GridOverlay from './components/GridOverlay.vue'
import HeroDisplay from './components/HeroDisplay.vue'
import ContentCommander from './components/ContentCommander/ContentCommander.vue'
import PhosphorOverlay from './components/PhosphorOverlay.vue'
import NoiseOverlay from './components/NoiseOverlay.vue'
import SoundManager from './sfx/SoundManager'
import BootLoader from './components/BootLoader.vue'
import VfdDisplay from './components/VfdDisplay.vue'
import CrtControls from './components/CrtControls.vue'
import TrackerOverlay from './components/TrackerOverlay.vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { chatStore } from './store/chatStore';


let cursorInterval = null;
let clockInterval = null;
const currentTime = ref('');

const updateTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString('en-US', { hour12: false });
};


const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Initialize to center to avoid initial jump/offset
const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)

const isCursorVisible = ref(false)
const isBooted = ref(false)
let hideCursorTimeout = null
const screenRect = ref(null); // Cache for performance
const activeTabIndex = ref(0);
const lastActiveContentTab = ref(1); // Default to BUSINESS
const isScrollingManually = ref(false);

const tabs = [
  { id: 'home', name: 'HOME' },
  { id: 'business', name: 'BUSINESS' },
  { id: 'about', name: 'ABOUT' },
  { id: 'guestbook', name: 'GUESTBOOK' },
  { id: 'chat', name: 'CHAT' }
];

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
  
  // Robust Screen Rect Init
  nextTick(() => {
      updateScreenRect();
      // Retry for layout shifts
      setTimeout(updateScreenRect, 100);
      setTimeout(updateScreenRect, 500);
      
      // ResizeObserver for robustness
      const el = document.querySelector('.app-container');
      if (el) {
          const ro = new ResizeObserver(updateScreenRect);
          ro.observe(el);
      }
  });
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

  // PRECISION: Sync scroll lock with browser's scrollend event
  // Re-attached when isBooted changes since the element is conditional
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

  // 2. Play Boot Sound
  SoundManager.playBootSequence();
  
  // 3. Preload Tracker Data for Visuals (Offline)
  SoundManager.loadVisualizer('/music/impulse.s3m');

  // 4. Start Tracker Music
  setTimeout(() => {
    SoundManager.playTrackerMusic('/music/impulse.s3m');
  }, 3800); 
  
  // 4. Reveal Content
  isBooted.value = true;
  vfdBootState.value = 'complete'; 
  
  // 5. Trigger Post-Boot SONY Logo
  vfdMode.value = 'logo';
  setTimeout(() => {
        vfdMode.value = 'spectrum';
  }, 2100); 
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
  window.addEventListener('keydown', handleGlobalKeydown, { capture: true }); // Capture to intercept before inputs if needed, but we check target

  // Start glitch loop immediately
  triggerGlitch();
})

const vfdMode = ref('spectrum'); // Start with canvas for loading bar
const vfdKnobInfo = ref({ label: '', value: '' });
// Boot items
const vfdBootState = ref('loading'); // 'loading', 'ready', 'complete', 'connecting'
const vfdStatusText = ref('wait');
const bootProgress = ref(0);

// VFD Label Glow - based on VFD activity
const vfdLabelGlow = computed(() => {
  if (vfdMode.value === 'spectrum' || vfdBootState.value === 'loading') {
    return '0.35'; // High glow during spectrum/loading
  } else if (vfdMode.value === 'logo' || vfdMode.value === 'knob') {
    return '0.20'; // Medium glow
  }
  return '0.0'; // No glow when off
});

let previousVfdMode = 'spectrum';

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('focus', hideCursor)
  document.removeEventListener('mouseenter', hideCursor)
  
  document.removeEventListener('click', hideCursor) // Remove old ref if needed, but handled by handleGlobalClick now
  document.removeEventListener('mouseover', handleGlobalHover);
  window.removeEventListener('keydown', handleGlobalKeydown);
  
  clearInterval(cursorInterval)
  if (clockInterval) clearInterval(clockInterval);
})

const handleGlobalKeydown = (e) => {
  if (!isBooted.value) return;

  // 1. Ignore if typing in an input or textarea
  const target = e.target;
  if (target.matches('input, textarea, [contenteditable="true"]')) {
      return; 
  }

  // Check if we are currently at the top (Hero section)
  const scrollContainer = document.querySelector('.scroll-content');
  if (!scrollContainer) return;

  const isAtTop = scrollContainer.scrollTop < window.innerHeight / 2;

  // 2. Tab Navigation (Centralized)
  if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (activeTabIndex.value + 1) % tabs.length;
      handleTabSelect(nextIndex);
      SoundManager.playTypingSound();
  } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (activeTabIndex.value - 1 + tabs.length) % tabs.length;
      handleTabSelect(prevIndex);
      SoundManager.playTypingSound();
  }

  // 3. Hero Transition
  if (isAtTop && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      // Move to the last active content tab (or Business)
      if (activeTabIndex.value === 0) {
          handleTabSelect(lastActiveContentTab.value);
      }
  }
}

// 4. Robust Scroll Listener Attachment
watch(isBooted, (booted) => {
    if (booted) {
        nextTick(() => {
            const scrollContainer = document.querySelector('.scroll-content');
            if (scrollContainer) {
                scrollContainer.addEventListener('scrollend', () => {
                    isScrollingManually.value = false;
                });
            }
        });
    }
});

const handleScroll = (e) => {
    // If we just clicked a tab, ignore the scroll events triggered by that smooth scroll
    if (isScrollingManually.value) return;

    const scrollTop = e.target.scrollTop;
    
    // TWEAK: Decisive thresholds to prevent flickering
    // High sensitivity for HOME when at top, larger gap for content
    const heroThreshold = window.innerHeight * 0.15; // Re-select HOME very early when scrolling UP
    const contentThreshold = window.innerHeight * 0.55; // Re-select CONTENT only when half-way down
    
    if (scrollTop < heroThreshold) {
        if (activeTabIndex.value !== 0) {
            activeTabIndex.value = 0;
        }
    } else if (scrollTop >= contentThreshold) {
        if (activeTabIndex.value === 0) {
            activeTabIndex.value = lastActiveContentTab.value;
        }
    }
}

const scrollToContent = () => {
    const scrollContainer = document.querySelector('.scroll-content');
    const sections = document.querySelectorAll('.page-section');
    if (sections.length > 1) {
        sections[1].scrollIntoView({ behavior: 'smooth' });
    }
};

const handleTabSelect = (index) => {
    // CRITICAL: Set lock BEFORE updating index to stop observer immediately
    isScrollingManually.value = true;
    
    activeTabIndex.value = index;
    
    // Update lastActiveContentTab if not HOME (0)
    if (index > 0) {
        lastActiveContentTab.value = index;
    }

    const finishScroll = () => {
        // Fallback timeout: Increased to 2000ms to cover long wrap-around scrolls (Chat -> Home)
        setTimeout(() => { isScrollingManually.value = false; }, 2000);
    };

    if (tabs[index].id === 'home') {
        const scrollContainer = document.querySelector('.scroll-content');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
            finishScroll();
        }
    } else {
        scrollToContent();
        finishScroll();
    }
};

const resetToDefaults = () => {
    brightness.value = 1;
    contrast.value = 1;
    hue.value = 0.5;
    SoundManager.setMasterVolume(0.9);
    SoundManager.playTypingSound();
};

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

// --- Power Controls Logic ---
import { SYSTEM_CONFIG } from './config';

const SETTINGS_KEY = 'crt_settings';
const NICKNAME_KEY = 'chat_nickname';

const loadSettings = () => {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.warn('Failed to load settings', e);
        return null;
    }
};

const loadNickname = () => {
    try {
        const saved = localStorage.getItem(NICKNAME_KEY);
        return saved || '';
    } catch (e) {
        return '';
    }
};

// 1. Load nickname FIRST and sync with store immediately (before other refs)
const initialNickname = loadNickname();
chatStore.nickname = initialNickname;

const savedSettings = loadSettings();

const volume = ref(savedSettings?.volume ?? SYSTEM_CONFIG.AUDIO.MASTER_VOL);
const brightness = ref(savedSettings?.brightness ?? SYSTEM_CONFIG.VISUALS.BRIGHTNESS_DEFAULT);
const contrast = ref(savedSettings?.contrast ?? SYSTEM_CONFIG.VISUALS.CONTRAST_DEFAULT);

// Sync initial volume
SoundManager.setMasterVolume(volume.value);

const saveSettings = () => {
    const settings = {
        volume: volume.value,
        brightness: brightness.value,
        contrast: contrast.value
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const saveNickname = (nick) => {
    localStorage.setItem(NICKNAME_KEY, nick);
};

// Auto-save on change
watch([volume, brightness, contrast], saveSettings);
watch(() => chatStore.nickname, (newNick) => {
    saveNickname(newNick);
});

// Generic Knob State handled in CrtControls
// VFD Updates
const handleKnobStart = ({ type, value }) => {
    // Switch VFD to Knob Mode
    if (vfdMode.value !== 'knob') {
        previousVfdMode = vfdMode.value;
        vfdMode.value = 'knob';
    }
    updateKnobText(type, value);
};

const handleKnobChange = ({ type, value }) => {
    // Update local state is handled by v-model events automatically for volume/brt/con
    // But we need to update VFD text and side effects
    
    if (type === 'vol') {
        SoundManager.setMasterVolume(value); // Side effect
    }
    updateKnobText(type, value);
};

const handleKnobEnd = () => {
    // Restore VFD
    if (vfdMode.value === 'knob') {
        vfdMode.value = previousVfdMode;
    }
};

const updateKnobText = (type, val) => {
    let label = '';
    let pct = 0;
    
    if (type === 'vol') {
        label = 'VOLUME';
        pct = Math.round(val * 100);
    } else if (type === 'brt') {
        label = 'BRGHTNSS';
        // Map 0.5-1.5 range to 0-100%
        pct = Math.round((val - 0.5) * 100);
    } else if (type === 'con') {
        label = 'CONTRST';
        // Map 0.5-1.5 range to 0-100%
        pct = Math.round((val - 0.5) * 100);
    }
    // Clamp to 0-100 just in case
    pct = Math.max(0, Math.min(100, pct));
    
    vfdKnobInfo.value = { label, value: `${pct}%` };
};

const scanlineColor = `hsl(10, 0%, 10%)`;
const vfdBgColor = `hsl(188, 42%, 7%)`;


</script>

<template>
  <div class="crt-wrapper">
    
    <!-- Fixed Status LEDs -->
    <!-- Extracted Controls (LEDs + Knobs) -->
    <CrtControls
        v-model:volume="volume"
        v-model:brightness="brightness"
        v-model:contrast="contrast"
        :is-caps-lock="isCapsLock"
        :is-hdd-active="isHddActive"
        :is-turbo="isTurbo"
        :power-led="true"
        @knob-start="handleKnobStart"
        @knob-change="handleKnobChange"
        @knob-end="handleKnobEnd"
    />

    <!-- VFD Display (Replaces Logo) -->
    <!-- VFD Label -->
    <div class="vfd-label-box">
        <img src="./assets/ownedge-logo.png" class="bezel-logo" />
        <div class="vfd-label-text">
            <div class="vfd-label-line1">VF-1OOO</div>
            <div class="vfd-label-line2">SUPER</div>
        </div>
    </div>
    
    <!-- VFD Display (Extracted to component) -->
    <VfdDisplay 
        :mode="vfdMode"
        :knob-info="vfdKnobInfo"
        :boot-state="vfdBootState"
        :boot-progress="bootProgress"
        :status-text="vfdStatusText"
        :scanline-color="vfdBgColor"
    />

    <div class="crt-screen">
      <!-- Apply 'crt-content' class for filter -->
      <div class="app-container">
        <!-- Fixed Background/Overlays -->
        <BootLoader 
          :is-booted="isBooted" 
          @start="handleBootStart"
          @progress="(p) => bootProgress = p"
          @ready="() => vfdBootState = 'ready'"
          @connecting="() => vfdBootState = 'connecting'"
          @status-update="(s) => vfdStatusText = s"
        />
        <NoiseOverlay />

        <div class="fixed-background">
            <GridOverlay />
            <TrackerOverlay />
        </div>

        <!-- Scrollable Content -->
        <div class="scroll-content" v-if="isBooted" @scroll.passive="handleScroll">
          <section class="page-section hero-section" :style="heroStyle">
            <HeroDisplay />
          </section>
          
          <section class="page-section">
            <ContentCommander 
               :tabs="tabs" 
               :active-index="activeTabIndex" 
               @update:active-index="handleTabSelect"
               @reset-settings="resetToDefaults"
            />
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
    
    <!-- SVG Filter for Glitch/Distortion and Texture Masks -->
    <!-- CRITICAL: Must have dimensions for mask percentages to work -->
    <svg width="100%" height="100%" style="position: absolute; top:0; left:0; pointer-events: none; z-index: 0;">
      <defs>
        <filter id="spherical-warp" x="-10%" y="-10%" width="200%" height="200%">
          <feTurbulence :baseFrequency="turbulenceFreq" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        

        <!-- Bezel Mask: Reveals bezel only, hides screen center -->
        <mask id="bezel-mask" maskUnits="userSpaceOnUse">
           <rect width="100%" height="100%" fill="white" />
           <rect x="40" y="40" width="calc(100% - 80px)" height="calc(100% - 120px)" rx="40" fill="black" />
        </mask>
      </defs>
    </svg>
    
    <!-- Bezel Reflection Overlay -->
    <TrackerOverlay :reflection-only="true" :screen-rect="screenRect" />

    <!-- Vintage Sony Sticker (Top Left) -->
    <div class="bezel-sticker">
        <img src="./assets/sony-sticker.png" alt="It's a Sony" />
        <div class="sticker-wear"></div>
    </div>
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
  background-image: url("data:image/svg+xml,%3Csvg width='34' height='34' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7841 12.3673H5.65376Z' fill='rgba(255, 255, 0, 0.7)'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 45; /* Below Scanlines (50) and Vignette (60) */
  /* Adjust transform to align tip of arrow */
  transform: translate(0, 0); 
  mix-blend-mode: normal; 
  will-change: transform;
  /* Add a drop shadow for glowing effect */
  filter: drop-shadow(0 0 5px rgb(255, 187, 0));
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
  padding: 40px 40px 80px 40px; /* Thicker chin */
  cursor: none; /* Ensure hidden here too */
  position: relative;
  overflow: hidden;
}

/* Bezel Texture Layers */
.crt-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  /* Generated Leather Texture (Inline SVG for reliability) */
  background-color: #222; /* Brighter base */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='white' surfaceScale='3'%3E%3CfeDistantLight azimuth='45' elevation='35'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23leather)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
  filter: contrast(1.9) brightness(0.4); 
  opacity: 0.1;
  /* Apply Mask */
  -webkit-mask: url(#bezel-mask);
  mask: url(#bezel-mask);
}

.crt-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  /* Scratches and wear marks */
  background-image: 
    url('./assets/bezel-scratches.png'), /* Top Right Scratch */
    url('./assets/bezel-scratches.png'), /* Bottom Left Scratch */
    linear-gradient(15deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 50%, transparent 51%),
    linear-gradient(165deg, transparent 28%, rgba(0,0,0,0.08) 29%, rgba(0,0,0,0.08) 30%, transparent 31%),
    linear-gradient(75deg, transparent 73%, rgba(255,255,255,0.02) 74%, rgba(255,255,255,0.02) 75%, transparent 76%),
    radial-gradient(ellipse at 15% 20%, rgba(0,0,0,0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 70%, rgba(0,0,0,0.03) 0%, transparent 40%),
    radial-gradient(ellipse at 40% 90%, rgba(0,0,0,0.04) 0%, transparent 45%);
  background-repeat: no-repeat, no-repeat, repeat, repeat, repeat, repeat, repeat, repeat;
  background-position: 95% 5%, 5% 95%, center, center, center, center, center, center;
  background-size: 400px 400px, 400px 400px, auto, auto, auto, auto, auto, auto;
  mix-blend-mode: color-dodge;
  /* Apply Mask to keep screen glass clean */
  -webkit-mask: url(#bezel-mask);
  mask: url(#bezel-mask);
}

/* Vintage Sticker Styles */
.bezel-sticker {
    position: absolute;
    top: 8px; /* Top bezel */
    left: 11px; /* Left bezel */
    width: 40px; /* Adjust size for Sony sticker */
    height: auto;
    z-index: 15;
    filter: contrast(0.8) brightness(1.7);
    transform: rotate(90deg);
    opacity: 0.36;
}

.bezel-sticker img {
    width: 100%;
    height: auto;
    display: block;
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
  border: 11px solid #232323;
}

.app-container {
  width: 101%;
  height: 101%;
  flex-shrink: 0; /* Prevent shrinking to fit */
  position: relative;
  background: radial-gradient(circle at center, #2f2f2f00 1%, #0e0e0e 90%);
  overflow: hidden; /* Container is fixed window */
  filter: url(#spherical-warp) brightness(v-bind(brightness*0.9)) contrast(v-bind(contrast)); /* Apply content distortion + Settings */
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
  height: 85%; /* Reveal next section peeking from bottom */
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
    transparent 2%,
    v-bind(scanlineColor) 95%
  );
  background-size: 2px 2px; /* Dot density */
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

/* VFD Display Styling (Replaces Monitor Brand) */
.vfd-display {
    position: absolute;
    bottom: 25px; 
    left: 50%;
    transform: translateX(-50%);
    background-color: #050908;
    border: 1px solid #1a1a1a; /* Darker border */
}

/* VFD Label Box */
.vfd-label-box {
    position: fixed;
    bottom: 1.8rem;
    left: calc(50% - 208px); /* Shifted to keep text in same absolute spot */
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    pointer-events: none;
    z-index: 10001;
}

.bezel-logo {
    height: 34px;
    width: 37px;
    /* Invert because the logo is likely dark, then dim to match the worn #444 labels */
    filter: invert(1) brightness(0.4) contrast(1.2) opacity(0.43);
    mix-blend-mode: normal; /* Normal for better visibility on dark */
}

.vfd-label-text {
    display: flex;
    flex-direction: column;
}

.vfd-label-line1 {
    font-family: 'Microgramma', 'Courier New', monospace;
    font-size: 0.61rem;
    color: #444;
    letter-spacing: 1px;
    transition: all 0.25s ease;
    text-align: right;
    line-height: 1.2;
    /* Radial gradient glow from VFD (right side) */
    background-image: radial-gradient(
        circle at 100% 50%, 
        color-mix(in srgb, #40e0d0, rgba(68,68,68,0.5) calc(100% - calc(v-bind(vfdLabelGlow) * 100%))) 0%, 
        #444 65%
    );
    background-clip: text;
    -webkit-background-clip: text;
}

.vfd-label-line2 {
    font-family: 'Microgramma', 'Courier New', monospace;
    font-size: 0.6rem;
    color: #444;
    letter-spacing: 1px;
    transition: all 0.25s ease;
    text-align: right;
    margin-top: 1px;
    /* Radial gradient glow from VFD (right side) */
    background-image: radial-gradient(
        circle at 100% 50%, 
        color-mix(in srgb, #40e0d0, rgba(68,68,68,0.5) calc(100% - calc(v-bind(vfdLabelGlow) * 100%))) 0%, 
        #444 65%
    );
    background-clip: text;
    -webkit-background-clip: text;
}

/* VFD Styles moved to VfdDisplay.vue */
</style>
