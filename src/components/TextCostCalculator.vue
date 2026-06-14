<template>
  <section id="text-calculator" class="section-block">
    <h2>文本模型成本估算</h2>
    <p>输入平均 tokens 和每月请求次数后，对比不同文本模型的预计月成本。</p>

    <div class="calculator-grid">
      <label class="field">
        <span>平均输入 tokens</span>
        <input v-model.number="inputTokens" type="number" min="1" />
      </label>
      <label class="field">
        <span>平均输出 tokens</span>
        <input v-model.number="outputTokens" type="number" min="1" />
      </label>
      <label class="field">
        <span>每月请求次数</span>
        <input v-model.number="monthlyRequests" type="number" min="1" />
      </label>
      <label class="toggle-field">
        <input v-model="useCachedInput" type="checkbox" />
        <span>使用缓存输入价格</span>
      </label>
    </div>

    <PresetButtons :presets="textPresets" @select="applyPreset" />

    <p v-if="hasInvalidInput" class="form-alert">请输入有效的正数</p>

    <div v-else class="result-panel">
      <div class="summary-grid">
        <article class="summary-card summary-card-strong">
          <span>最低成本模型</span>
          <strong>{{ cheapestResult.model }}</strong>
          <em>{{ formatUSD(cheapestResult.totalCost) }} / 月</em>
        </article>
        <article class="summary-card">
          <span>最高成本模型</span>
          <strong>{{ priciestResult.model }}</strong>
          <em>{{ formatUSD(priciestResult.totalCost) }} / 月</em>
        </article>
        <article class="summary-card">
          <span>预计节省</span>
          <strong>{{ formatUSD(savingsAmount) }}</strong>
          <em>相比最高成本节省 {{ savingsPercent }}%</em>
        </article>
      </div>

      <p class="result-copy">
        在每月 {{ formatNumber(monthlyRequests) }} 次请求、每次输入
        {{ formatNumber(inputTokens) }} tokens、输出 {{ formatNumber(outputTokens) }}
        tokens 的情况下：{{ cheapestResult.model }} 预计月成本最低，约为
        {{ formatUSD(cheapestResult.totalCost) }}。{{ priciestResult.model }}
        预计月成本最高，约为 {{ formatUSD(priciestResult.totalCost) }}。选择
        {{ cheapestResult.model }} 相比 {{ priciestResult.model }} 每月可节省约
        {{ formatUSD(savingsAmount) }}。
      </p>

      <CostResultTable :results="results" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { textModels, textPresets } from '../data/pricingData'
import CostResultTable from './CostResultTable.vue'
import PresetButtons from './PresetButtons.vue'
import {
  calculateAllTextModels,
  formatUSD,
  isPositiveNumber,
} from '../utils/costCalculator'

const inputTokens = ref(1000)
const outputTokens = ref(500)
const monthlyRequests = ref(100000)
const useCachedInput = ref(false)

const hasInvalidInput = computed(
  () =>
    !isPositiveNumber(inputTokens.value) ||
    !isPositiveNumber(outputTokens.value) ||
    !isPositiveNumber(monthlyRequests.value),
)

const results = computed(() => {
  if (hasInvalidInput.value) {
    return []
  }

  return calculateAllTextModels(
    textModels,
    Number(inputTokens.value),
    Number(outputTokens.value),
    Number(monthlyRequests.value),
    useCachedInput.value,
  )
})

const cheapestResult = computed(() => results.value[0])
const priciestResult = computed(() => results.value[results.value.length - 1])
const savingsAmount = computed(
  () => priciestResult.value.totalCost - cheapestResult.value.totalCost,
)
const savingsPercent = computed(() => {
  if (priciestResult.value.totalCost <= 0) {
    return '0.0'
  }

  return ((savingsAmount.value / priciestResult.value.totalCost) * 100).toFixed(1)
})

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value))
}

function applyPreset(preset) {
  inputTokens.value = preset.inputTokens
  outputTokens.value = preset.outputTokens
  monthlyRequests.value = preset.monthlyRequests
}
</script>
