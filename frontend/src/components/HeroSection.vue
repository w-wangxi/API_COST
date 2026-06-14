<template>
  <section class="hero-section">
    <div class="hero-content">
      <p class="eyebrow">Model pricing intelligence</p>
      <h1>海外 AI API 成本分析看板</h1>
      <p class="hero-copy">
        按你的请求量、tokens 和图片规模，比较主流文本与图像模型的月度 API 成本。
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href="#text-calculator">开始计算</a>
        <a class="button button-secondary" href="#/pricing">查看价格来源</a>
      </div>
    </div>

    <div class="hero-metrics" aria-label="价格覆盖范围">
      <article>
        <span>覆盖厂商</span>
        <strong>{{ providerCount }}</strong>
        <em>{{ providerSummary }}</em>
      </article>
      <article>
        <span>跟踪模型</span>
        <strong>{{ modelCount }}</strong>
        <em>文本模型 {{ textModelCount }} 个 · 图像模型 {{ imageModelCount }} 个</em>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  textModels: {
    type: Array,
    default: () => [],
  },
  imageModels: {
    type: Array,
    default: () => [],
  },
})

const allModels = computed(() => [...props.textModels, ...props.imageModels])
const providerNames = computed(() => {
  const providers = allModels.value
    .map((model) => model.provider)
    .filter(Boolean)

  return [...new Set(providers)]
})

const providerCount = computed(() => providerNames.value.length || '--')
const textModelCount = computed(() => props.textModels.length)
const imageModelCount = computed(() => props.imageModels.length)
const modelCount = computed(() => textModelCount.value + imageModelCount.value || '--')
const providerSummary = computed(() => {
  if (!providerNames.value.length) {
    return '等待后端价格数据'
  }

  const visibleProviders = providerNames.value.slice(0, 4)
  const hiddenCount = providerNames.value.length - visibleProviders.length

  return hiddenCount > 0
    ? `${visibleProviders.join(' / ')} 等 ${providerNames.value.length} 家`
    : visibleProviders.join(' / ')
})
</script>
