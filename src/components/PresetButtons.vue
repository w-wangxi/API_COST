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
        <span>
          {{ formatNumber(preset.monthlyRequests) }} 次/月 · 输入
          {{ formatNumber(preset.inputTokens) }} · 输出
          {{ formatNumber(preset.outputTokens) }}
        </span>
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

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value))
}
</script>
