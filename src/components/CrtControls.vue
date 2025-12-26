<script setup>
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps({
  volume: { type: Number, required: true },
  brightness: { type: Number, required: true }, // 0.5 - 1.5
  contrast: { type: Number, required: true },   // 0.5 - 1.5
  isCapsLock: { type: Boolean, default: false },
  isHddActive: { type: Boolean, default: false },
  isTurbo: { type: Boolean, default: true },
  powerLed: { type: Boolean, default: true }
});

const emit = defineEmits([
  'update:volume', 
  'update:brightness', 
  'update:contrast',
  'knob-start', // { type, value }
  'knob-change', // { type, value }
  'knob-end'
]);

// Generic Knob State
const activeKnob = ref(null); // 'vol', 'brt', 'con'
const startY = ref(0);
const startValue = ref(0);

const handleKnobDown = (e, type) => {
    activeKnob.value = type;
    startY.value = e.clientY;
    
    // Capture distinct start values
    if (type === 'vol') startValue.value = props.volume;
    if (type === 'brt') startValue.value = props.brightness;
    if (type === 'con') startValue.value = props.contrast;

    // Notify Parent (for VFD)
    emit('knob-start', { type, value: startValue.value });

    document.addEventListener('mousemove', handleKnobMove);
    document.addEventListener('mouseup', handleKnobUp);
    e.preventDefault(); 
};

const handleKnobMove = (e) => {
    if (!activeKnob.value) return;
    const deltaY = startY.value - e.clientY; 
    const sensitivity = 0.005; 
    let newVal = startValue.value + deltaY * sensitivity;

    if (activeKnob.value === 'vol') {
        newVal = Math.max(0, Math.min(1, newVal));
        emit('update:volume', newVal);
    } 
    else if (activeKnob.value === 'brt') {
        newVal = Math.max(0.5, Math.min(1.5, newVal)); // 50% to 150%
        emit('update:brightness', newVal);
    }
    else if (activeKnob.value === 'con') {
        newVal = Math.max(0.5, Math.min(1.5, newVal)); // 50% to 150%
        emit('update:contrast', newVal);
    }
    
    // Notify Parent for VFD updates
    emit('knob-change', { type: activeKnob.value, value: newVal });
};

const handleKnobUp = () => {
    activeKnob.value = null;
    emit('knob-end');
    
    document.removeEventListener('mousemove', handleKnobMove);
    document.removeEventListener('mouseup', handleKnobUp);
};

onUnmounted(() => {
    document.removeEventListener('mousemove', handleKnobMove);
    document.removeEventListener('mouseup', handleKnobUp);
});

// Computed Styles
const getKnobRotation = (val, min, max) => {
    // Normalize to 0-1
    const norm = (val - min) / (max - min);
    // Map to -135deg to +135deg
    return `rotate(${(norm * 270) - 135}deg)`;
};

const volKnobStyle = computed(() => ({ transform: getKnobRotation(props.volume, 0, 1) }));
const brtKnobStyle = computed(() => ({ transform: getKnobRotation(props.brightness, 0.5, 1.5) }));
const conKnobStyle = computed(() => ({ transform: getKnobRotation(props.contrast, 0.5, 1.5) }));

</script>

<template>
    <div class="crt-controls">
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

        <!-- Power Panel (Knobs + Power LED) -->
        <div class="power-panel">
            <!-- Volume Knob -->
            <div class="volume-control" @mousedown="(e) => handleKnobDown(e, 'vol')">
                 <div class="knob-container">
                     <div class="knob-ring"></div>
                     <div class="knob-arrows">
                         <span class="arrow-up">▲</span>
                         <span class="arrow-down">▼</span>
                     </div>
                     <div class="knob" :style="volKnobStyle">
                         <div class="knob-marker"></div>
                     </div>
                 </div>
                 <span class="led-label">VOLUME</span>
            </div>

            <!-- Brightness Knob -->
            <div class="volume-control" @mousedown="(e) => handleKnobDown(e, 'brt')">
                 <div class="knob-container">
                     <div class="knob-ring"></div>
                     <div class="knob-arrows">
                         <span class="arrow-up">▲</span>
                         <span class="arrow-down">▼</span>
                     </div>
                     <div class="knob" :style="brtKnobStyle">
                         <div class="knob-marker"></div>
                     </div>
                 </div>
                 <span class="led-label">BRIGHT</span>
            </div>

            <!-- Contrast Knob -->
            <div class="volume-control" @mousedown="(e) => handleKnobDown(e, 'con')">
                 <div class="knob-container">
                     <div class="knob-ring"></div>
                     <div class="knob-arrows">
                         <span class="arrow-up">▲</span>
                         <span class="arrow-down">▼</span>
                     </div>
                     <div class="knob" :style="conKnobStyle">
                         <div class="knob-marker"></div>
                     </div>
                 </div>
                 <span class="led-label">CONTRST</span>
            </div>

            <div class="led-group">
                <div class="led power-led" :class="{ active: powerLed }"></div>
                <span class="led-label">POWER</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    gap: 0.8rem;
    width: 60px; /* Enforce overlapping width to keep centers equidistant */
}

.led {
    width: 18px;
    height: 7px;
    background-color: #0b1d0b;
    border: 1px solid #132a13;
    box-shadow: inset 0 0 2px rgba(0,0,0,0.8);
    transition: all 0.1s ease;
    
    /* Dot Matrix Effect */
    background-image: 
        radial-gradient(circle at center, rgba(0,0,0,0) 0.5px, rgba(0,0,0,0.24) 1.5px);
    background-size: 2px 2px; /* 3px dots grid */
    image-rendering: pixelated;
}

@keyframes led-pulse {
    0%, 100% { filter: brightness(0.9); }
    50% { filter: brightness(1.1) drop-shadow(0 0 6px rgba(255,255,255,0.2)); }
}

/* Common Active State for Animation */
.led.active, .power-led {
    animation: led-pulse 8s ease-in-out infinite;
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
    border-color: #422700;
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
    font-family: 'Microgramma', 'Courier New', monospace;
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
    align-items: flex-end; /* Fix alignment issues with mixed height items */
    gap: 1.5rem; /* Standardized gap */
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

/* Volume Knob */
.volume-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    width: 60px; /* Fixed Layout Width */
    /* Remove padding/margin hacks - 60px is sufficient tap target */
    padding: 0; 
    margin: 0;
    position: relative;
    z-index: 10005; /* Ensure it's above other things */
    pointer-events: auto; /* Capture hover in padded area */
}

.knob-container {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.knob-arrows {
    position: absolute;
    left: -15px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 0;
    transition: opacity 0.6s;
    pointer-events: none;
}

.arrow-up, .arrow-down {
    font-size: 8px;
    color: #424242;
}

.volume-control:hover .knob-arrows {
    opacity: 1;
}

.volume-control:hover .knob {
    cursor: grab;
}

.volume-control:active .knob {
    cursor: grabbing;
}

.knob {
    width: 24px;
    height: 24px;
    background: radial-gradient(circle at 30% 30%, #333, #111);
    border-radius: 50%;
    border: 1px solid #000;
    box-shadow: 
        0 2px 5px rgba(0,0,0,0.8),
        inset 0 1px 1px rgba(255,255,255,0.1);
    position: relative;
    cursor: ns-resize; /* Indicate drag */
    pointer-events: auto; /* Enable interaction */
}

.knob-marker {
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    background-color: #e32a01;
    box-shadow: 
        0 0 2px #ff0000, 
        0 0 5px rgba(255, 0, 0, 0.6);
    border-radius: 50%;
    animation: led-pulse 8s ease-in-out infinite;
}
</style>
