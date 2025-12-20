<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
let animationFrameId = null;

  const resize = () => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d', { alpha: false });
    // Use client dimensions for 1:1 pixel mapping, avoiding scaling issues
    // But be careful of high-DPI displays (Retina). 
    // For faithful retro look, 1:1 CSS pixels is fine, or we can use devicePixelRatio.
    // Let's stick to 1:1 CSS pixels for performance and exact alignment with getBoundingClientRect.
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };
  
  onMounted(() => {
  window.addEventListener('resize', resize);
  
  // Call resize immediately to set initial size
  // Note: we need to wait for next tick or just rely on the fact we are mounted.
  setTimeout(resize, 0);

  const render = () => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value; // Access canvas ref directly in loop to be safe
    const ctx = canvas.getContext('2d', { alpha: false });
    const width = canvas.width;
    const height = canvas.height;

    // 1. Decay (Fade out previous frames)
    ctx.globalCompositeOperation = 'source-over';
    // Increased opacity to 0.15 to make trails fade faster ("less burn in")
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.fillRect(0, 0, width, height);

    // 2. Draw new light sources
    ctx.globalCompositeOperation = 'lighter';
    
    // Get canvas position relative to viewport to correct offsets
    const canvasRect = canvas.getBoundingClientRect();
    
    // Find targets - Updated to use wrappers for precision
    // We target .logo-img and .typing-wrapper (which wraps all our typing text)
    const targets = document.querySelectorAll('.logo-img, .typing-wrapper');

    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      // Only draw if on screen
      if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;
      
      // Check visibility/opacity approximate
      const style = window.getComputedStyle(el);
      // Note: wrapper might not have opacity set, but parent does. 
      // check el.closest opacity? Or just assume visible.
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Use computed color from element to match perfectly
      // We use globalAlpha to make it a ghost trail
      ctx.globalAlpha = 0.5;
      
      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;
      const w = rect.width;
      const h = rect.height;
      
      // User requested: No blur, 0 offset. Sharp burn-in.
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      // Shadow color doesn't matter without blur, but if we used it:
      // ctx.shadowColor = style.color; 

      if (el.tagName === 'IMG') {
         try {
             // Apply CSS filters (like invert, brightness) so the image looks correct on canvas
             if (style.filter && style.filter !== 'none') {
                 ctx.filter = style.filter;
             }
             ctx.drawImage(el, x, y, w, h);
             ctx.filter = 'none'; // Reset
         } catch(e) {}
      } else {
         // Use the element's own color
         ctx.fillStyle = style.color;
         
         ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
         // Use middle baseline for better vertical centering alignment matches
         ctx.textBaseline = 'middle'; 
         
         if (style.letterSpacing && style.letterSpacing !== 'normal') {
             ctx.letterSpacing = style.letterSpacing;
         }

         // Force LEFT alignment because .typing-wrapper is "inline-block" and wraps the text tight.
         // 'rect.left' is the exact start of the text.
         ctx.textAlign = 'left';
         ctx.fillText(el.innerText, x, y + h / 2);
      }
      
      ctx.shadowBlur = 0;
      ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1.0; // Reset
    });

    animationFrameId = requestAnimationFrame(render);
  };

  render();
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <canvas ref="canvasRef" class="phosphor-canvas"></canvas>
</template>

<style scoped>
.phosphor-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 40; /* Above content (20), below Grid/Scanlines (50) */
  mix-blend-mode: screen; 
  opacity: 0.13;
}
</style>
