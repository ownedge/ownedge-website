<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SoundManager from '../../sfx/SoundManager';

// Import logos
import barclaysLogo from '../../assets/customers/barclays.jpg';
import controlinvestLogo from '../../assets/customers/controlinvest.jpg';
import copidataLogo from '../../assets/customers/copidata.jpeg';
import fluxygenLogo from '../../assets/customers/fluxygen.png';
import kabisaLogo from '../../assets/customers/kabisa.jpeg';
import lithoformasLogo from '../../assets/customers/lithoformas.png';
import philipsLogo from '../../assets/customers/philips.png';
import thalesLogo from '../../assets/customers/thales.jpg';

const customers = [
  { name: 'BARCLAYS', logo: barclaysLogo },
  { name: 'CONTROLINVEST', logo: controlinvestLogo },
  { name: 'COPIDATA', logo: copidataLogo },
  { name: 'FLUXYGEN', logo: fluxygenLogo },
  { name: 'KABISA', logo: kabisaLogo },
  { name: 'LITHO FORMAS', logo: lithoformasLogo },
  { name: 'PHILIPS', logo: philipsLogo },
  { name: 'THALES', logo: thalesLogo }
];

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
      e.stopImmediatePropagation();
      const nextIndex = (currentIndex + 1) % businessTabs.length;
      selectTab(businessTabs[nextIndex].id);
  } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopImmediatePropagation();
      const prevIndex = (currentIndex - 1 + businessTabs.length) % businessTabs.length;
      selectTab(prevIndex >= 0 ? businessTabs[prevIndex].id : businessTabs[businessTabs.length - 1].id);
  }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown, { capture: true });
});
</script>

<template>
  <div class="section-content animate-in">
    <h3>> BUSINESS</h3>
    
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
          <div class="group-grid">
            <!-- Syndiscape -->
            <div class="group-box">
              <div class="box-header">SYNDISCAPE</div>
              <div class="box-body">
                <p class="box-desc">Full-stack design and software studio. Engineering digital products with a focus on high-fidelity interactive systems and creative code.</p>
                <div class="box-meta">STATUS: ACTIVE</div>
              </div>
            </div>

            <!-- Zizara -->
            <div class="group-box">
              <div class="box-header">ZIZARA</div>
              <div class="box-body">
                <p class="box-desc">Venture and angel capital. Providing strategic guidance and early-stage funding for ambitious startups in their embryonic phase.</p>
                <div class="box-meta">STATUS: ACTIVE</div>
              </div>
            </div>

            <!-- Raven -->
            <div class="group-box">
              <div class="box-header">RAVEN</div>
              <div class="box-body">
                <p class="box-desc">Comprehensive aviation solutions. Specialized in advanced flight training, certification protocols, and aircraft electronics.</p>
                <div class="box-meta">STATUS: ACTIVE</div>
              </div>
            </div>

            <!-- Advech Engineering -->
            <div class="group-box">
              <div class="box-header">ADVECH ENGINEERING</div>
              <div class="box-body">
                <p class="box-desc">Industrial design and precision manufacturing. Producing custom equipment and parts via composites, CNC, and 3D printing.</p>
                <div class="box-meta">STATUS: ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTabId === 'services'" class="tab-content">
          <h4>SERVICES</h4>
          <div class="service-grid">
            <div class="service-block">
              <h5>INTERACTIVE SYSTEMS</h5>
              <p>Engineering low-latency, high-fidelity interfaces and custom design systems. Specialized in WebGL, real-time visualization, and reactive architecture.</p>
            </div>
            <div class="service-block">
              <h5>CINEMATIC TECH PROPS</h5>
              <p>Design and fabrication of period-accurate and retro-futuristic interfaces for film. Technically correct terminal systems and hardware peripherals.</p>
            </div>
            <div class="service-block">
              <h5>AEROSPACE & AVIONICS</h5>
              <p>Specialized aviation solutions including advanced flight training systems, certification protocols, and custom aircraft electronics integration.</p>
            </div>
            <div class="service-block">
              <h5>PRECISION ENGINEERING</h5>
              <p>Industrial design and manufacturing of custom equipment. Expertise in composite materials, high-precision CNC machining, and industrial 3D printing.</p>
            </div>
            <div class="service-block">
              <h5>STRATEGIC VENTURE</h5>
              <p>Strategic guidance and seed-stage funding for technical startups. Providing the architectural and capital foundation for ambitious embryonic projects.</p>
            </div>
            <div class="service-block">
              <h5>INFRASTRUCTURE</h5>
              <p>Design and deployment of resilient, permanent digital infrastructure. Focus on secure, high-availability architecture for modern enterprise assets.</p>
            </div>
          </div>
        </div>

        <div v-if="activeTabId === 'customers'" class="tab-content">
          <h4>CUSTOMERS</h4>
          <p>Strategic partnerships with global industry leaders and visionaries.</p>
          <div class="logo-grid">
            <div v-for="customer in customers" :key="customer.name" class="logo-item" :title="customer.name">
              <span class="logo-hover-name">{{ customer.name }}</span>
              <img :src="customer.logo" />
            </div>
          </div>
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
    margin-bottom: 20px;
    font-size: 1.4rem;
    letter-spacing: 1px;
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
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-top: 10px;
}

.service-block h5 {
    color: var(--color-accent);
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    font-weight: bold;
    letter-spacing: 1px;
}

.service-block p {
    font-size: 1.05rem;
    line-height: 1.6;
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
}

.customer-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.customer-list li {
    font-size: 1.15rem;
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

.logo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    margin-top: 10px; /* Standardize with other grids */
}

.logo-item {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 10px;
    aspect-ratio: 3/2;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
}

.logo-item:hover {
    background: rgba(255, 255, 255, 0.06);
}

.logo-hover-name {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80%;
    height: 80%;
    background: #ffffff;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 0.8rem;
    text-align: center;
    padding: 5px;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
    pointer-events: none;
    border-radius: 4px;
}

.logo-item:hover .logo-hover-name {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.logo-item img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    /* Maintain original colors */
    filter: contrast(1.05) brightness(1.05);
    mix-blend-mode: screen;
    opacity: 0.85;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-item:hover img {
    opacity: 0;
    transform: scale(0.85);
}

.animate-in {
    animation: slideUp 0.3s ease-out;
}

/* Group Grid Styles */
.group-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 10px;
}

.group-box {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
}

.box-header {
    background: #fff;
    color: #000;
    padding: 6px 14px;
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 1px;
}

.box-body {
    padding: 15px;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.box-desc {
    font-size: 1.1rem !important;
    line-height: 1.6 !important;
    margin-bottom: 12px !important;
    color: rgba(255, 255, 255, 0.7) !important;
}

.box-meta {
    margin-top: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    color: var(--color-accent);
}

.sub-entity {
    margin-bottom: 15px;
}

.sub-entity:last-child {
    margin-bottom: 0;
}

.entity-name {
    color: #fff;
    font-size: 0.9rem;
    font-weight: bold;
    margin-bottom: 4px;
    border-left: 2px solid var(--color-accent);
    padding-left: 8px;
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

    .logo-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
    }
}
</style>
