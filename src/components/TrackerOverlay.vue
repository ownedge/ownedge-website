<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../sfx/SoundManager';

const canvasRef = ref(null);
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
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // --- RENDER CONSTANTS ---
    const ROWS_TO_SHOW = 4; 
    const lineHeight = 16;
    const startX = canvas.width / 2 - 40;
    const startY = 6; 

    // --- DATA FETCH ---
    let currentPos = SoundManager.getTrackerPosition();
    let isMock = false;
    let isWaitingForData = false;

    // --- MOCK DATA FALLBACK (Real S3M Preview) ---
    if (!currentPos) {
        isMock = true;
        
        // Auto-scroll simulation
        // Fast scroll: 120ms / row
        const now = Date.now();
        const simulatedRowIndex = Math.floor(now / 120); 
        
        // Fetch from offline visualizer module
        const previewData = SoundManager.getVisualizerData(simulatedRowIndex);
        
        if (previewData) {
            currentPos = previewData;
        } else {
             // Visualizer not loaded yet
             isWaitingForData = true;
        }
    }
    
    // --- RENDER WINDOW ---
    // User requested "First 3 lines inside top monitor frame"
    // We interpret this as Current Row + Next 2 Rows

    if (isWaitingForData) {
        ctx.fillStyle = 'rgba(33, 241, 235, 0.51)'; 
        ctx.font = 'bold 19px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText("NO DATA YET", startX, startY + lineHeight);
        
        animationFrameId = requestAnimationFrame(draw);
        return;
    }

    for (let offset = 0; offset <= ROWS_TO_SHOW; offset++) {
        let rPos = currentPos.row + offset;
        let pPos = currentPos.pattern;
        
        // Handle Pattern Boundary Wrapping (Simple)
        let channels = [];
        
        if (rPos >= 0 && rPos < (currentPos.numRows || 64)) {
            // Fetch real data or mock data
            if (isMock) {
                 // For offline visualizer
                 const now = Date.now();
                 const simulatedRowIndex = Math.floor(now / 120) + offset;
                 const verifyData = SoundManager.getVisualizerData(simulatedRowIndex);
                 
                 channels = verifyData ? verifyData.channels : ["...", "...", "...", "..."];
            } else {
                channels = SoundManager.getPatternRowData(pPos, rPos) || [];
                if (channels.length === 0) channels = ["???", "???", "???", "???"];
            }
        } else {
            // Out of bounds
            channels = ["", "", "", ""]; 
        }

        // Draw
        const y = startY + (offset * lineHeight);
        
        // Style
        if (offset === 0) {
            // Current Row
            ctx.fillStyle = 'rgba(33, 241, 235, 0.9)';
            ctx.font = 'bold 14px "Courier New", monospace';
        } else {
            // Future Rows
            // Fade out slightly
            const opacity = 0.7 - (offset * 0.15);
            ctx.fillStyle = `rgba(33, 241, 235, ${opacity})`;
            ctx.font = '14px "Courier New", monospace';
        }
        
        // Render
        const channelStr = (channels || []).map(c => c ? c.replace(/\.\.\./g, '...') : '...').join('  ');
        // If empty row (out of bounds), show structure or blank?
        // Let's show blank if it's truly out of bounds, but keep alignment
        if (channels[0] !== "") {
             const str = `${String(rPos).padStart(2,'0')} | ${channelStr}`;
             ctx.fillText(str, startX, y);
        }
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
    <div class="tracker-overlay">
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

canvas {
    display: block;
}
</style>
