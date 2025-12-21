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
  
  const mouseX = ref(-100);
  const mouseY = ref(-100);

  const updateMouse = (e) => {
    mouseX.value = e.clientX;
    mouseY.value = e.clientY;
  };

  onMounted(() => {
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', updateMouse);
    
    // Call resize immediately to set initial size
    setTimeout(resize, 0);

    const render = () => {
      if (!canvasRef.value) return;
      const canvas = canvasRef.value; 
      const ctx = canvas.getContext('2d', { alpha: false });
      const width = canvas.width;
      const height = canvas.height;

      // 1. Decay 
      ctx.globalCompositeOperation = 'source-over';
      // Decreased opacity to 0.05 to make trails fade slower ("more burn in")
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; 
      ctx.fillRect(0, 0, width, height);

      // 2. Draw cursor trail
      if (mouseX.value > 0 && mouseY.value > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#ff0055'; // Pink trail color

        ctx.save();
        ctx.translate(mouseX.value-15, mouseY.value-15);
        
        // Draw the arrow shape from App.vue custom-cursor
        ctx.beginPath();
        ctx.moveTo(0.5, 1.19);   // Top Tip
        ctx.lineTo(11.78, 12.36); // Right Wing
        ctx.lineTo(5.65, 12.36);  // Inner corner
        ctx.lineTo(5.31, 12.49);  // Inner detail
        ctx.lineTo(0.5, 16.88);   // Bottom Tip
        ctx.closePath();
        
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw new light sources
      ctx.globalCompositeOperation = 'lighter';
      
      const canvasRect = canvas.getBoundingClientRect();
      const targets = document.querySelectorAll('.logo-img, .typing-wrapper');


    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      // Only draw if on screen
      if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;
      
      // Check visibility/opacity approximate
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Check parent opacity (specifically for logo container fade-in)
      let fadeInOp = 1.0;
      if (el.parentElement) {
        const parentStyle = window.getComputedStyle(el.parentElement);
        fadeInOp = parseFloat(parentStyle.opacity);
        // If effective opacity is near zero, skip drawing cleanly
        if (fadeInOp < 0.01) return;
      }

      // Use computed color from element to match perfectly
      // We use globalAlpha to make it a ghost trail
      // Reduce alpha for images (logo) to avoid blown-out glow
      // MULTIPLY by fadeInOp so the trail fades in exactly with the element
      const baseAlpha = el.tagName === 'IMG' ? 0.1 : 0.5;
      ctx.globalAlpha = baseAlpha * fadeInOp;
      
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
  window.removeEventListener('mousemove', updateMouse);
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
