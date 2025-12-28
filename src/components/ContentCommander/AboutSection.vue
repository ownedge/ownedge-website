<template>
  <div class="section-content animate-in">
    <h3>> WHOAMI</h3>
    <p>System initialization complete. Welcome to OWNEDGE OS.</p>
    <p>I am a creative technologist focused on high-fidelity digital experiences. This terminal serves as a central hub for all project-related telemetry and communication protocols.</p>
    <div class="status-grid">
      <div class="status-item"><span>CPU:</span> <span>80486DX4</span></div>
      <div class="status-item"><span>OS:</span> <span>OWNEDGE-V2</span></div>
      <div class="status-item"><span>LOC:</span> <span>BERLIN.DE</span></div>
      <div class="status-item"><span>AUTH:</span> <span>ADMIN</span></div>
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

.status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 30px;
    background: rgba(255,255,255,0.02);
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.1);
}

.status-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #888;
}

.status-item span:last-child {
    color: #fff;
    font-weight: bold;
}

.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
    .status-grid {
        grid-template-columns: 1fr;
    }
}
</style>
