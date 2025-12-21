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
      const targets = document.querySelectorAll('.logo-img, .typing-wrapper, .status, .id, .percentage, .log-text, .btn-go, .hint-text, .tui-header .title, .tui-header .clock, .pane-title, .col-name, .col-type, .col-date, .pane-footer, .f-key span, .f-label, .view-content pre, .cursor');
 
     targets.forEach(el => {
       const rect = el.getBoundingClientRect();
       
       // Only draw if on screen
       if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;
       
       const style = window.getComputedStyle(el);
       if (style.display === 'none' || style.visibility === 'hidden') return;
 
       // Opacity check
       let fadeInOp = 1.0;
       if (el.parentElement) {
         const p1 = window.getComputedStyle(el.parentElement);
         if (parseFloat(p1.opacity) < 0.99) fadeInOp = parseFloat(p1.opacity);
       }
       if (fadeInOp < 0.01) return;
 
       const baseAlpha = el.tagName === 'IMG' ? 0.01 : 0.4;
       ctx.globalAlpha = baseAlpha * fadeInOp;
       
       const x = rect.left - canvasRect.left;
       const y = rect.top - canvasRect.top;
       const w = rect.width;
       const h = rect.height;
       
       ctx.save(); // Save before potential clipping

       // Check for clipping containers (Scrollable panes)
       if (el.matches('.view-content pre, .col-name, .col-type, .col-date')) {
           const scrollParent = el.closest('.pane-content');
           if (scrollParent) {
               const pRect = scrollParent.getBoundingClientRect();
               // Create clipping path based on parent bounds
               const clipX = pRect.left - canvasRect.left;
               const clipY = pRect.top - canvasRect.top;
               ctx.beginPath();
               ctx.rect(clipX, clipY, pRect.width, pRect.height);
               ctx.clip();
           }
       }
       
       ctx.shadowBlur = 0;
       
       if (el.tagName === 'IMG') {
          try {
              if (style.filter && style.filter !== 'none') ctx.filter = style.filter;
              ctx.drawImage(el, x, y, w, h);
              ctx.filter = 'none'; 
          } catch(e) {}
       } else {
          // TEXT
          ctx.fillStyle = style.color;
          ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          if (style.letterSpacing !== 'normal') ctx.letterSpacing = style.letterSpacing;

          // Alignment
          const align = style.textAlign;
          const pt = parseFloat(style.paddingTop);
          const pl = parseFloat(style.paddingLeft);
          const pr = parseFloat(style.paddingRight);
          const bl = parseFloat(style.borderLeftWidth);

          const contentX = x + bl + pl;
          
          const contentW = w - (bl + pl + parseFloat(style.borderRightWidth) + pr);

          ctx.textAlign = (align === 'center' || align === 'right') ? align : 'left';
          
          let drawX = contentX;
          if (align === 'center') drawX = contentX + contentW / 2;
          if (align === 'right') drawX = contentX + contentW;

          // SPECIAL TEXT HANDLING
          let textToDraw = el.innerText;
          
          // For wrappers that contain the cursor span, we want ONLY the text content
          // to avoid double-drawing the cursor or drawing it slightly offset
          if (el.classList.contains('typing-wrapper') || el.classList.contains('log-text')) {
              textToDraw = Array.from(el.childNodes)
                .filter(n => n.nodeType === Node.TEXT_NODE)
                .map(n => n.textContent)
                .join('');
          }

          if (el.tagName === 'PRE') {
               const lines = textToDraw.split('\n');
               const lh = style.lineHeight === 'normal' ? parseFloat(style.fontSize) * 1.2 : parseFloat(style.lineHeight);
               ctx.textBaseline = 'top';
               lines.forEach((line, i) => {
                   ctx.fillText(line, drawX, y + pt + (i * lh) + 4); 
               });
          } else if (el.classList.contains('typing-wrapper')) {
               ctx.textAlign = 'left';
               // Revert to middle baseline to fix "under text" issue
               // Bottom alignment caused it to drop due to line-height descent space
               ctx.textBaseline = 'middle';
               ctx.fillText(textToDraw, contentX, y + h / 2);
          } else {
               ctx.textBaseline = 'middle';
               ctx.fillText(textToDraw, drawX, y + h / 2);
          }
       }
       ctx.letterSpacing = '0px';
       
       ctx.restore(); // Restore from clipping
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
