<template>
  <section id="pricing-sources" class="section-block">
    <h2>价格来源与查询日期</h2>
    <p>价格数据写入本地配置，页面展示来源名称和统一查询日期。</p>

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
</script>
