<template>
  <div class="preset-panel">
    <div class="preset-heading">
      <span>场景预设</span>
    </div>
    <div class="preset-buttons">
      <button
        v-for="preset in presets"
        :key="preset.name"
        type="button"
        class="preset-button"
        @click="$emit('select', preset)"
      >
        <strong>{{ preset.name }}</strong>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  presets: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])
</script>
