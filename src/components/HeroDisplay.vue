<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../utils/SoundManager';

const titleFull = "OWNEDGE";
const titleText = ref("");

const subtitles = [
  "ORCHESTRATING VALUE",
  "STRATEGIC INVESTMENT",
  "SOFTWARE ENGINEERING",
  "OPERATIONAL EXCELLENCE"
];

const displayedText = ref("");
let currentSubtitleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimeout = null;
let titleTimeout = null;
const isSubtitleActive = ref(false); // New state to control subtitle start

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const heroRoot = ref(null);
const isVisible = ref(true);
let observer = null;

const decodeEffect = () => {
  let iterations = 0;
  
  // Clear any existing timeout just in case
  clearTimeout(titleTimeout);

  titleTimeout = setInterval(() => {
    titleText.value = titleFull
      .split("")
      .map((letter, index) => {
        if (index < iterations) {
          return titleFull[index];
        }
        // Play grit sound for active decoding
        if (isVisible.value) SoundManager.playDecodeSound();
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");

    if (iterations >= titleFull.length) { 
      clearInterval(titleTimeout);
      // Wait a moment for impact before starting subtitles
      setTimeout(() => {
        isSubtitleActive.value = true;
        if (isVisible.value) typeWriter();
      }, 200);
    }
    
    iterations += 1 / 3; 
  }, 50);
}

const typeWriter = () => {
  if (!isSubtitleActive.value || !isVisible.value) return; // Guard clause

  const currentSubtitle = subtitles[currentSubtitleIndex];

  if (isDeleting) {
    displayedText.value = currentSubtitle.substring(0, charIndex - 1);
    charIndex--;
  } else {
    displayedText.value = currentSubtitle.substring(0, charIndex + 1);
    charIndex++;
    SoundManager.playTypingSound();
  }

  let typeSpeed = 100; // Type speed

  if (isDeleting) {
    typeSpeed /= 5; // Delete faster
  }

  if (!isDeleting && charIndex === currentSubtitle.length) {
    typeSpeed = 2000; // Pause at end
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    currentSubtitleIndex = (currentSubtitleIndex + 1) % subtitles.length;
    typeSpeed = 500; // Pause before typing new
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(typeWriter, typeSpeed);
};

onMounted(() => {
  // Setup Intersection Observer
  observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          isVisible.value = entry.isIntersecting;
          if (isVisible.value && isSubtitleActive.value) {
              // Create a small delay to avoid double invocation if timer is pending
              clearTimeout(typingTimeout); 
              typeWriter();
          }
      });
  }, { threshold: 0.1 });

  if (heroRoot.value) observer.observe(heroRoot.value);

  // Start decode effect immediately
  decodeEffect();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  clearTimeout(typingTimeout);
  clearInterval(titleTimeout);
});
</script>

<template>
  <div class="hero-display" ref="heroRoot">
    <div class="content">
      <h1 class="title">
        <span class="typing-wrapper">
          {{ titleText }}
        </span>
      </h1>
      <div class="large-counter" aria-hidden="true">
        <img src="../assets/ownedge-logo.png" alt="Ownedge Logo" class="logo-img" />
      </div>
      
      <p class="subtitle">
        <span class="typing-wrapper" v-if="isSubtitleActive">
          {{ displayedText }}<span class="cursor">█</span>
        </span>
      </p>
    </div>
    
    <div class="scroll-indicator">
      <div class="mouse-icon"></div>
      <div class="arrow-scroll"></div>
    </div>
  </div>
</template>

<style scoped>

.hero-display {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  z-index: 20;
  position: relative;
}

.content {
  text-align: center;
  position: relative;
}

.typing-wrapper {
  display: inline-block;
  position: relative;
  min-height: 1.2rem; /* Match subtitle font size/line-height to prevent collapse */
  vertical-align: bottom;
}

.title {
  font-size: 8vw;
  font-weight: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 
    0 0 10px rgba(255,255,255,0.3),
    0 0 20px rgba(255,255,255,0.3),
    0 0 30px rgba(255,255,255,0.3);
  /* Removed animation: fadeInUp since we are typing it now */
  min-height: 1.2em; /* Prevent layout shift */
}

/* Rest of styles remain mostly same, just ensuring fadeInUp is not conflicting */
.large-counter {
  font-size: 25vw;
  line-height: 1;
  color: rgba(255, 255, 255, 0.03);
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  font-family: var(--font-mono);
  font-weight: bold;
  opacity: 0;
  animation: fadeIn 3s ease-in-out 0.3s forwards;
}

.logo-img {
  width: 25vw;
  height: auto;
  opacity: 0.05; 
  display: block;
  filter: brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.1));
  transition: all 1s ease;
  pointer-events: auto; 
}

.subtitle {
  font-size: 1.2rem;
  letter-spacing: 0.4em;
  color: var(--color-accent);
  text-transform: uppercase;
  /* Removed animation: fadeInUp/opacity:0 because it needs to be visible for typing */
  text-shadow: 0 0 10px var(--color-accent), 0 0 20px var(--color-accent);
  min-height: 1.5em; 
}

.cursor {
  display: inline-block;
  position: absolute;
  left: 100%;
  bottom: 0;
  animation: blink 1s step-end infinite;
  color: var(--color-accent);
  text-shadow: 0 0 10px var(--color-accent);
  margin-left: 2px;
  width: 1ch; /* Ensure it has width to render even if absolute */
}

/* Ensure title cursor is white though */
.title .cursor {
    color: #fff;
    text-shadow: 0 0 10px #fff;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
  }
  to { 
    opacity: 1; 
  }
}

.scroll-indicator {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0;
  animation: fadeIn 1s ease-out 4s forwards; /* Delay appearance until after title decode */
  pointer-events: none;
}

.scroll-text {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--color-accent);
  text-shadow: 0 0 5px var(--color-accent);
  opacity: 0.7;
}

.arrow-scroll {
  width: 15px;
  height: 15px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
  animation: scrollBounce 2s infinite;
}

@keyframes scrollBounce {
  0% { transform: rotate(45deg) translate(0, 0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: rotate(45deg) translate(10px, 10px); opacity: 0; }
}
</style>
