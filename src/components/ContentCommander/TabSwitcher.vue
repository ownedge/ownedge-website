<script setup>
const props = defineProps({
  tabs: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 }
});

const emit = defineEmits(['select']);

const selectTab = (index) => {
  emit('select', index);
};

const handleTabKeydown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTab(index);
    }
};
</script>

<template>
  <div class="tui-tab-bar">
      <div 
        v-for="(tab, index) in tabs" 
        :key="tab.id"
        class="tui-tab"
        :class="{ active: activeIndex === index }"
        @click="selectTab(index)"
        @keydown="(e) => handleTabKeydown(e, index)"
        tabindex="0"
        role="tab"
        :aria-selected="activeIndex === index"
      >
        <span class="tab-name">{{ tab.name }}</span>
      </div>
  </div>
</template>

<style scoped>
.tui-tab-bar {
    display: flex;
    padding: 0;
    gap: 0;
    align-items: flex-end; /* Ground the tabs so they expand upwards smoothly */
    height: 64px; /* Total height of largest tab */
    margin: 0;
    width: 100%;
}

.tui-tab-bar::before {
    content: '';
    width: 30px;
    background: #fff;
}

.tui-tab-bar::after {
    content: '';
    flex: 1;
    background: #fff;
    min-width: 15px;
}

.tui-tab {
    padding: 0 30px;
    cursor: pointer;
    color: #000;
    background: #fff;
    display: flex;
    align-items: center;
    height: 44px; /* Base height */
    transition: all 0.2s cubic-bezier(0.19, 1, 0.22, 1);
    box-sizing: border-box; /* Crucial for border-based layout stability */
}

.tui-tab:hover:not(.active) {
    background: #f0f0f0;
}

.tui-tab.active {
    background: transparent;
    color: #fff;
    height: 44px; /* Maintain consistent height */
    position: relative;
    z-index: 5;
    border-left: 1px solid #fff;
    border-right: 1px solid #fff;
}

.tab-name {
    font-size: 0.85rem;
    font-weight: bold;
    letter-spacing: 1px;
}
@media (max-width: 900px) {
    .tui-tab-bar {
        overflow-x: auto;
        padding-bottom: 5px; /* Space for scrollbar if any */
        height: 50px;
        scrollbar-width: none;
    }

    .tui-tab-bar::-webkit-scrollbar {
        display: none;
    }

    .tui-tab-bar::before,
    .tui-tab-bar::after {
        display: none;
    }
    
    .tui-tab,
    .tui-tab.active {
        padding: 0 15px;
        flex-shrink: 0;
        height: 40px;
    }
    
    .tab-name {
        font-size: 0.75rem;
    }
}
</style>
