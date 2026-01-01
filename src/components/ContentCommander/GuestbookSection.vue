<template>
  <div class="section-content animate-in">
    <h3>> GUEST LOG</h3>
    <p>Leave your mark on the system memory.</p>
    <div class="input-simulation">
      <span>NAME:</span> <span class="cursor-block">_</span>
    </div>
    <div class="recent-messages">
      <p class="msg">"System looks tight." - user_01</p>
      <p class="msg">"10/10 vibes." - retro_fan</p>
    </div>
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
    letter-spacing: 1px;
}

.input-simulation {
    background: #111;
    padding: 15px;
    border: 1px solid #333;
    margin: 20px 0;
}

.cursor-block {
    animation: blink-fast 0.6s step-end infinite;
    background: var(--color-accent);
    color: #000;
}

.recent-messages {
    font-size: 0.9rem;
    opacity: 0.7;
}

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
</style>
