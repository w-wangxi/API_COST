<template>
  <section id="pricing-sources" class="section-block">
    <h2>价格来源与查询日期</h2>
    <p>价格数据写入本地配置，页面展示模型单价、来源名称和统一查询日期。</p>

    <div class="pricing-block">
      <h3>文本模型价格</h3>
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>厂商</th>
              <th>模型</th>
              <th>输入价格</th>
              <th>缓存输入价格</th>
              <th>输出价格</th>
              <th>计费单位</th>
              <th>数据来源</th>
              <th>查询日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="model in textModels" :key="`${model.provider}-${model.model}`">
              <td>{{ model.provider }}</td>
              <td class="model-name">{{ model.model }}</td>
              <td>{{ formatPrice(model.inputPrice) }}</td>
              <td>{{ formatOptionalPrice(model.cachedInputPrice) }}</td>
              <td>{{ formatPrice(model.outputPrice) }}</td>
              <td>{{ model.unit }}</td>
              <td>{{ model.source }}</td>
              <td>{{ model.queryDate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pricing-block">
      <h3>图像模型价格</h3>
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>厂商</th>
              <th>模型</th>
              <th>单价</th>
              <th>计费方式</th>
              <th>计费单位</th>
              <th>数据来源</th>
              <th>查询日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="model in imageModels" :key="`${model.provider}-${model.model}`">
              <td>{{ model.provider }}</td>
              <td class="model-name">{{ model.model }}</td>
              <td>{{ formatPrice(model.price) }}</td>
              <td>{{ billingLabel(model.billingType) }}</td>
              <td>{{ model.unit }}</td>
              <td>{{ model.source }}</td>
              <td>{{ model.queryDate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pricing-block">
      <h3>来源汇总</h3>
      <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>平台</th>
            <th>官方页面</th>
            <th>模型数量</th>
            <th>查询日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="source in sources" :key="source.provider">
            <td>{{ source.provider }}</td>
            <td>{{ source.source }}</td>
            <td>{{ source.modelCount }}</td>
            <td>{{ source.queryDate }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { imageModels, textModels } from '../data/pricingData'

const sources = computed(() => {
  const sourceMap = new Map()

  for (const item of [...textModels, ...imageModels]) {
    const key = `${item.provider}-${item.source}`
    const current = sourceMap.get(key)

    if (current) {
      current.modelCount += 1
      continue
    }

    sourceMap.set(key, {
      provider: item.provider,
      source: item.source,
      queryDate: item.queryDate,
      modelCount: 1,
    })
  }

  return [...sourceMap.values()]
})

function formatPrice(value) {
  return `$${Number(value).toFixed(3).replace(/\.?0+$/, '')}`
}

function formatOptionalPrice(value) {
  return value === null ? '不适用' : formatPrice(value)
}

function billingLabel(type) {
  return type === 'per_megapixel' ? '按 megapixel 计费' : '按图片计费'
}
</script>
