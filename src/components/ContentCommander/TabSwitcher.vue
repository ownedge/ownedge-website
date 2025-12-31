<script setup>
import { computed } from 'vue';

const props = defineProps({
  tabs: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 }
});

const emit = defineEmits(['select']);

const selectTab = (index) => {
  emit('select', index);
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
    align-items: stretch;
    height: 44px;
    margin: 0; /* Removed margin for seamless alignment */
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
    transition: none;
    height: 100%;
}

.tui-tab:hover:not(.active) {
    background: #f0f0f0;
}

.tui-tab.active {
    background: transparent;
    color: #fff;
    height: 64px;
    align-self: center;
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
</style>
