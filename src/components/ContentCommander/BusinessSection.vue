<template>
  <div class="section-content animate-in">
    <h3>> OFFERINGS.DAT</h3>
    <div class="service-list">
      <div class="service-row">
        <span class="service-name">UI/UX ENGINEERING</span>
        <span class="service-cost">PREMIUM</span>
      </div>
      <div class="service-row">
        <span class="service-name">WEBGL/3D SYNTHESIS</span>
        <span class="service-cost">HI-END</span>
      </div>
      <div class="service-row">
        <span class="service-name">BRAND IDENTITY</span>
        <span class="service-cost">CORE</span>
      </div>
    </div>
    <p class="blink-fast" style="margin-top: 20px;">READY FOR NEW ASSIGNMENTS_</p>
  </div>
</template>

<style scoped>
.section-content h3 {
    margin-top: 0;
    color: var(--color-accent);
    border-bottom: 1px solid rgba(64, 224, 208, 0.3);
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 20px;
    font-size: 1.4rem;
}

.service-list {
    margin-bottom: 20px;
}

.service-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.1);
}

.service-name { font-weight: bold; }
.service-cost { color: var(--color-accent); }

.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes blink-fast {
    50% { opacity: 0; }
}

.blink-fast {
    animation: blink-fast 0.8s step-end infinite;
}
</style>
