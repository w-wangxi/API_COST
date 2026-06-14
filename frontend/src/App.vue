<template>
  <main class="app-shell" aria-label="AI API Cost Calculator">
    <header class="top-nav">
      <a class="brand" href="#/">
        <span class="brand-mark">AI</span>
        <span>API Cost Calculator</span>
      </a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="#/">Calculator</a>
        <a href="#/pricing">Pricing Sources</a>
      </nav>
    </header>

    <HeroSection
      v-if="currentPage === 'calculator'"
      :text-models="pricingData.textModels"
      :image-models="pricingData.imageModels"
    />

    <template v-if="currentPage === 'calculator'">
      <TextCostCalculator
        :text-models="pricingData.textModels"
        :text-presets="pricingData.textPresets"
      />
      <ImageCostCalculator
        :image-models="pricingData.imageModels"
        :image-presets="pricingData.imagePresets"
      />
    </template>

    <PricingSourceTable
      v-else
      :text-models="pricingData.textModels"
      :image-models="pricingData.imageModels"
      :metadata="pricingData.metadata"
      :is-refreshing="isRefreshing"
      :refresh-error="refreshError"
      @refresh="refreshPricingData"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import HeroSection from './components/HeroSection.vue'
import TextCostCalculator from './components/TextCostCalculator.vue'
import ImageCostCalculator from './components/ImageCostCalculator.vue'
import PricingSourceTable from './components/PricingSourceTable.vue'
import { createFallbackPricingData, fetchPricingData } from './services/pricingApi'

const pricingData = ref(createFallbackPricingData())
const routeHash = ref(window.location.hash || '#/')
const isRefreshing = ref(false)
const refreshError = ref('')
let pricingRetryTimer = null

const currentPage = computed(() => (routeHash.value === '#/pricing' ? 'pricing' : 'calculator'))

onMounted(async () => {
  window.addEventListener('hashchange', syncRouteHash)
  await loadPricingData()
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRouteHash)
  stopPricingRetry()
})

function syncRouteHash() {
  routeHash.value = window.location.hash || '#/'
}

async function loadPricingData(options = {}) {
  try {
    const nextPricingData = await fetchPricingData(options)
    pricingData.value = nextPricingData
    refreshError.value = ''

    if (hasModelData(nextPricingData)) {
      stopPricingRetry()
      return
    }
  } catch {
    pricingData.value = createFallbackPricingData()
    refreshError.value = '价格数据刷新失败，请检查后端日志。'
  }

  startPricingRetry()
}

async function refreshPricingData() {
  isRefreshing.value = true
  stopPricingRetry()

  try {
    await loadPricingData({ forceRefresh: true })
  } finally {
    isRefreshing.value = false
  }
}

function startPricingRetry() {
  if (pricingRetryTimer) {
    return
  }

  pricingRetryTimer = window.setInterval(loadPricingData, 5000)
}

function stopPricingRetry() {
  if (!pricingRetryTimer) {
    return
  }

  window.clearInterval(pricingRetryTimer)
  pricingRetryTimer = null
}

function hasModelData(data) {
  return data.textModels.length > 0 || data.imageModels.length > 0
}
</script>
