<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../../sfx/SoundManager';

const businessTabs = [
  { id: 'group', name: 'THE GROUP' },
  { id: 'services', name: 'SERVICES' },
  { id: 'customers', name: 'CUSTOMERS' }
];

const activeTabId = ref('group');

const selectTab = (id) => {
  if (activeTabId.value !== id) {
    activeTabId.value = id;
    SoundManager.playTypingSound();
  }
};

const handleKeydown = (e) => {
  const currentIndex = businessTabs.findIndex(t => t.id === activeTabId.value);
  
  if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % businessTabs.length;
      selectTab(businessTabs[nextIndex].id);
  } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + businessTabs.length) % businessTabs.length;
      selectTab(businessTabs[prevIndex].id);
  }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="section-content animate-in">
    <h3>> BUSINESS.SYS</h3>
    
    <div class="business-layout">
      <!-- Left Menu -->
      <div class="business-menu">
        <div 
          v-for="tab in businessTabs" 
          :key="tab.id"
          class="menu-item"
          :class="{ active: activeTabId === tab.id }"
          @click="selectTab(tab.id)"
        >
          <span class="indicator">></span>
          <span class="label">{{ tab.name }}</span>
        </div>
      </div>

      <!-- Right Content -->
      <div class="business-viewport">
        <div v-if="activeTabId === 'group'" class="tab-content">
          <h4>THE GROUP</h4>
          <p>OWNEDGE is a boutique collective of specialists dedicated to building resilient systems and high-end digital products.</p>
          <p>Founded on the principles of direct responsibility and technical excellence, we operate as a distributed unit of architects, engineers, and designers.</p>
          <div class="stat-box">
            <div class="stat-line">STATUS: OPERATIONAL</div>
            <div class="stat-line">NODES: DISTRIBUTED</div>
            <div class="stat-line">SINCE: 2011</div>
          </div>
        </div>

        <div v-if="activeTabId === 'services'" class="tab-content">
          <h4>SERVICES</h4>
          <div class="service-grid">
            <div class="service-block">
              <h5>UI/UX ENGINEERING</h5>
              <p>Specialized in low-latency, high-fidelity interfaces and custom design systems.</p>
            </div>
            <div class="service-block">
              <h5>3D SYNTHESIS</h5>
              <p>WebGL, Three.js, and real-time visualization for complex data sets.</p>
            </div>
            <div class="service-block">
              <h5>INFRASTRUCTURE</h5>
              <p>Scalable, secure, and permanent infrastructure design for modern assets.</p>
            </div>
          </div>
        </div>

        <div v-if="activeTabId === 'customers'" class="tab-content">
          <h4>CUSTOMERS</h4>
          <p>We work with partners who value long-term thinking and technical craftsmanship.</p>
          <ul class="customer-list">
            <li>GLOBAL FINTECH FIRMS</li>
            <li>CREATIVE TECHNOLOGY STUDIOS</li>
            <li>INFRASTRUCTURE PROVIDERS</li>
            <li>INDEPENDENT ARTISANS</li>
          </ul>
        </div>
      </div>
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
    margin-bottom: 30px;
    font-size: 1.2rem;
    letter-spacing: 2px;
}

.business-layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    min-height: 300px;
}

/* Left Menu */
.business-menu {
    display: flex;
    flex-direction: column;
    gap: 15px;
    border-right: 1px solid rgba(255,255,255,0.1);
    padding-right: 20px;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    color: #666;
    transition: all 0.2s ease;
}

.menu-item:hover {
    color: #fff;
}

.menu-item.active {
    color: var(--color-accent);
}

.menu-item .indicator {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.menu-item.active .indicator {
    opacity: 1;
}

/* Right Viewport */
.business-viewport {
    flex: 1;
}

.tab-content h4 {
    margin-top: 0;
    font-size: 1.4rem;
    color: #fff;
    margin-bottom: 20px;
    letter-spacing: 1px;
}

.tab-content p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.8);
    margin-bottom: 20px;
}

.stat-box {
    margin-top: 30px;
    padding: 20px;
    background: rgba(255,255,255,0.02);
    border-left: 3px solid var(--color-accent);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
}

.service-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

.service-block h5 {
    color: var(--color-accent);
    margin: 0 0 5px 0;
    font-size: 1rem;
}

.service-block p {
    font-size: 0.9rem;
    margin: 0;
}

.customer-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.customer-list li {
    font-size: 1rem;
    color: #fff;
    padding-left: 20px;
    position: relative;
}

.customer-list li::before {
    content: '■';
    position: absolute;
    left: 0;
    color: var(--color-accent);
    font-size: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
}

.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
    .business-layout {
        grid-template-columns: 1fr;
        gap: 30px;
    }
    
    .business-menu {
        flex-direction: row;
        border-right: none;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-right: 0;
        padding-bottom: 15px;
        overflow-x: auto;
    }
}
</style>
