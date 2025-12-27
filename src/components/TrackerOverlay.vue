<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../sfx/SoundManager';


const props = defineProps({
  screenRect: Object,
  reflectionOnly: Boolean
});
const canvasRef = ref(null);
const hasStarted = ref(false);
const dataFadeProgress = ref(0); // 0 to 1 for smooth fade-in
let animationFrameId = null;

const draw = () => {
    const canvas = canvasRef.value;
    if (!canvas) {
        animationFrameId = requestAnimationFrame(draw);
        return;
    }
    
    // Resize if needed
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';


    // --- RENDER CONSTANTS ---
    const ROWS_TO_SHOW = 4;
    const lineHeight = 16;
    
    // Calculate Position Per Frame to handle prop updates
    let startX = canvas.width / 2;
    let startY = 6;
    
    // Y-Logic:
    if (props.reflectionOnly && props.screenRect) {
        startY = props.screenRect.top;
        // X-Logic: Match the inner data's visual position.
        startX = props.screenRect.left + (canvas.width / 2);
    }

    // --- DATA FETCH ---
    let currentPos = SoundManager.getTrackerPosition();
    let isWaitingForData = false;

    if (!currentPos) {
        // Visualizer not loaded yet
        isWaitingForData = true;
    } else {
        // Data found - trigger fade-in
        if (!hasStarted.value) {
            hasStarted.value = true;
        }
    }
    
    // Animate fade-in when data starts
    if (hasStarted.value && dataFadeProgress.value < 1) {
        dataFadeProgress.value += 0.02; // Fade over ~50 frames (about 1 second)
        if (dataFadeProgress.value > 1) dataFadeProgress.value = 1;
    }

    if (isWaitingForData) {
        animationFrameId = requestAnimationFrame(draw);
        return;
    }

    for (let offset = 0; offset <= ROWS_TO_SHOW; offset++) {
        // Reflection Only: Draw top row only (offset 0)
        if (props.reflectionOnly && offset > 0) continue;
        
        let rPos = currentPos.row + offset;
        let pPos = currentPos.pattern;
        
        // Handle Pattern Boundary Wrapping (Simple)
        let channels = [];
        
        if (rPos >= 0 && rPos < (currentPos.numRows || 64)) {
            channels = SoundManager.getPatternRowData(pPos, rPos) || [];
            if (channels.length === 0) channels = ["???", "???", "???", "???"];
        } else {
            // Out of bounds
            channels = ["", "", "", ""]; 
        }

        // Draw
        // Normal: startY + offset*lineHeight
        // Reflection: startY (screenTop) 
        let y = startY + (offset * lineHeight);
        
        // Style
        if (offset === 0) {
            // Current Row
            ctx.fillStyle = 'rgba(33, 241, 235, 0.6)';
            if (props.reflectionOnly) ctx.fillStyle = 'rgba(33, 241, 235, 0.5)'; // Stronger reflection
            ctx.font = 'bold 16px "Courier New", monospace';
        } else {
            // Future Rows
            // Fade out slightly
            const opacity = 0.45 - (offset * 0.15);
            ctx.fillStyle = `rgba(33, 241, 235, ${opacity})`;
            ctx.font = '16px "Courier New", monospace';
        }
        
        // Render
        const channelStr = (channels || []).map(c => c ? c.replace(/\.\.\./g, '...') : '...').join('  ');
        // If empty row (out of bounds), show structure or blank?
        // Let's show blank if it's truly out of bounds, but keep alignment
        if (channels[0] !== "") {
            const str = `${String(rPos).padStart(2,'0')} | ${channelStr}`;
            if (props.reflectionOnly) {
                  // Mirror on Bezel
                  ctx.save();
                  ctx.translate(0, startY);
                  ctx.scale(1, -0.41); // Flip UP
                  ctx.fillText(str, startX +1, -4); // Small gap adjustment
                  ctx.restore();
             } else {
                 // Normal - apply fade-in
                 const prevAlpha = ctx.globalAlpha;
                 ctx.globalAlpha = dataFadeProgress.value;
                 ctx.fillText(str, startX, y);
                 ctx.globalAlpha = prevAlpha;
             }
        }
    }
    
    // EDGE FADE MASK (Reflection Only)
    // "Hide reflected line from absolute 0 to 40 and -40 to full width"
    if (props.reflectionOnly) {
         ctx.save();
         ctx.globalCompositeOperation = 'destination-in';
         const mask = ctx.createLinearGradient(0, 0, canvas.width, 0);
         mask.addColorStop(0, 'rgba(0, 0, 0, 0)');      // 0: Transparent
         mask.addColorStop(350 / canvas.width, 'rgba(0, 0, 0, 1)'); // 40px: Opaque
         mask.addColorStop((canvas.width - 350) / canvas.width, 'rgba(0, 0, 0, 1)'); // End-40px: Opaque
         mask.addColorStop(1, 'rgba(0, 0, 0, 0)');      // End: Transparent
         
         ctx.fillStyle = mask;
         // Fill entire top area where reflection lives
         // Reflection goes upwards from startY. Let's just fill the whole canvas for simplicity
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.restore();
    }
    
    animationFrameId = requestAnimationFrame(draw);
};

onMounted(() => {
    draw();
});

onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    // Optional: Clear history on unmount? Or keep for persistency?
    // window.trackerHistory = []; 
});
</script>

<template>
    <div :class="['tracker-overlay', { 'reflection-mode': reflectionOnly }]">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
.tracker-overlay {
    position: absolute;
    top: 0; /* Align to top of screen */
    left: 0;
    width: 100%;
    height: 80px; /* Constrained height */
    pointer-events: none;
    z-index: 15; /* Behind content (20) but above generic BG/Grid (10) */
    overflow: hidden;
    /* Optional: borders */
    /* border-bottom: 1px solid rgba(64, 224, 208, 0.1); */
}

.tracker-overlay.reflection-mode {
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    opacity: 0.9;
    filter: blur(3.85px);
    z-index: 100; /* Force above everything */
}

canvas {
    display: block;
}
</style>
