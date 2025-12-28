<template>
  <div class="section-content animate-in">
    <h3>> COMMS.EXE</h3>
    <div class="chat-window">
      <div class="chat-log">
        <p><span class="node">[NODE_0]</span> CONNECTED</p>
        <p><span class="node">[NODE_1]</span> SYNCING_</p>
      </div>
      <div class="chat-input">>_</div>
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
}

.chat-window {
    background: #000;
    border: 1px solid var(--color-accent);
    height: 150px;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.chat-log { flex: 1; font-size: 0.9rem; }
.chat-input { margin-top: 10px; color: var(--color-accent); font-weight: bold; }
.node { color: var(--color-accent); opacity: 0.8; }

.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
