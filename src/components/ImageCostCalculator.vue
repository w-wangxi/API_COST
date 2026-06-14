<template>
  <section id="image-calculator" class="section-block">
    <h2>图像模型成本估算</h2>
    <p>输入图片数量和图片尺寸后，对比 fal.ai 图像模型的预计成本。</p>

    <div class="calculator-grid">
      <label class="field">
        <span>每月图片数量</span>
        <input v-model.number="imageCount" type="number" min="1" :max="MAX_IMAGE_COUNT" />
      </label>
      <label class="field">
        <span>每张图 megapixel</span>
        <input
          v-model.number="megapixelPerImage"
          type="number"
          min="0.1"
          :max="MAX_MEGAPIXEL_PER_IMAGE"
          step="0.1"
        />
      </label>
    </div>

    <div class="preset-panel">
      <div class="preset-heading">
        <span>场景预设</span>
      </div>
      <div class="preset-buttons">
        <button
          v-for="preset in imagePresets"
          :key="preset.name"
          type="button"
          class="preset-button"
          @click="applyPreset(preset)"
        >
          <strong>{{ preset.name }}</strong>
          <span>
            {{ formatNumber(preset.imageCount) }} 张/月 ·
            {{ preset.megapixelPerImage }} megapixel/张
          </span>
        </button>
      </div>
    </div>

    <p v-if="validationMessage" class="form-alert">{{ validationMessage }}</p>

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
          <span>最低单图成本</span>
          <strong>{{ formatUSD(cheapestResult.averageImageCost) }}</strong>
          <em>按当前图片尺寸估算</em>
        </article>
      </div>

      <p class="result-copy">
        在每月生成 {{ formatNumber(imageCount) }} 张图片、每张图
        {{ megapixelPerImage }} megapixel 的情况下：{{ cheapestResult.model }}
        预计月成本最低，约为 {{ formatUSD(cheapestResult.totalCost) }}。
      </p>

      <ImageCostResultTable :results="results" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { imageModels, imagePresets } from '../data/pricingData'
import ImageCostResultTable from './ImageCostResultTable.vue'
import {
  calculateAllImageModels,
  formatUSD,
  isPositiveNumber,
} from '../utils/costCalculator'

const imageCount = ref(10000)
const megapixelPerImage = ref(1)

const MAX_IMAGE_COUNT = 10000000
const MAX_MEGAPIXEL_PER_IMAGE = 100

const validationMessage = computed(() => {
  if (!isPositiveNumber(imageCount.value) || !isPositiveNumber(megapixelPerImage.value)) {
    return '请输入有效的正数'
  }

  if (Number(imageCount.value) > MAX_IMAGE_COUNT) {
    return `每月图片数量不应超过 ${formatNumber(MAX_IMAGE_COUNT)}`
  }

  if (Number(megapixelPerImage.value) > MAX_MEGAPIXEL_PER_IMAGE) {
    return `每张图大小不应超过 ${MAX_MEGAPIXEL_PER_IMAGE} megapixel`
  }

  return ''
})

const results = computed(() => {
  if (validationMessage.value) {
    return []
  }

  return calculateAllImageModels(
    imageModels,
    Number(imageCount.value),
    Number(megapixelPerImage.value),
  )
})

const cheapestResult = computed(() => results.value[0])
const priciestResult = computed(() => results.value[results.value.length - 1])

function applyPreset(preset) {
  imageCount.value = preset.imageCount
  megapixelPerImage.value = preset.megapixelPerImage
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value))
}
</script>
