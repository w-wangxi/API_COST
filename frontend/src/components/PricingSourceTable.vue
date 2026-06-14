<template>
  <section id="pricing-sources" class="section-block page-section">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Pricing data</p>
        <h2>价格来源与查询日期</h2>
      </div>
      <div class="page-actions">
        <button class="button button-primary" type="button" :disabled="isRefreshing" @click="$emit('refresh')">
          {{ isRefreshing ? '刷新中...' : '刷新价格' }}
        </button>
        <a class="button button-secondary" href="#/">返回计算器</a>
      </div>
    </div>

    <div v-if="refreshError" class="form-alert">{{ refreshError }}</div>

    <div v-if="!hasPricingData" class="empty-state">
      暂无模型价格数据。后端可能正在刷新，请稍候；如果长时间无数据，请确认后端已启动。
    </div>

    <template v-else>
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
              <tr v-for="model in props.textModels" :key="`${model.provider}-${model.model}`">
                <td>{{ model.provider }}</td>
                <td class="model-name">{{ model.model }}</td>
                <td>{{ formatPrice(model.inputPrice) }}</td>
                <td>{{ formatOptionalPrice(model.cachedInputPrice) }}</td>
                <td>{{ formatPrice(model.outputPrice) }}</td>
                <td>{{ model.unit }}</td>
                <td>
                  <a class="source-link" :href="sourceUrl(model)" target="_blank" rel="noreferrer">
                    {{ model.source }}
                  </a>
                </td>
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
              <tr v-for="model in props.imageModels" :key="`${model.provider}-${model.model}`">
                <td>{{ model.provider }}</td>
                <td class="model-name">{{ model.model }}</td>
                <td>{{ formatPrice(model.price) }}</td>
                <td>{{ billingLabel(model.billingType) }}</td>
                <td>{{ model.unit }}</td>
                <td>
                  <a class="source-link" :href="sourceUrl(model)" target="_blank" rel="noreferrer">
                    {{ model.source }}
                  </a>
                </td>
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
                <td>
                  <a class="source-link" :href="source.url" target="_blank" rel="noreferrer">
                    {{ source.source }}
                  </a>
                </td>
                <td>{{ source.modelCount }}</td>
                <td>{{ source.queryDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  textModels: {
    type: Array,
    required: true,
  },
  imageModels: {
    type: Array,
    required: true,
  },
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isRefreshing: {
    type: Boolean,
    default: false,
  },
  refreshError: {
    type: String,
    default: '',
  },
})

defineEmits(['refresh'])

const hasPricingData = computed(() => props.textModels.length || props.imageModels.length)

const sources = computed(() => {
  const sourceMap = new Map()

  for (const item of [...props.textModels, ...props.imageModels]) {
    const key = `${item.provider}-${item.source}`
    const current = sourceMap.get(key)

    if (current) {
      current.modelCount += 1
      continue
    }

    sourceMap.set(key, {
      provider: item.provider,
      source: item.source,
      url: sourceUrl(item),
      queryDate: item.queryDate,
      modelCount: 1,
    })
  }

  return [...sourceMap.values()]
})

function formatPrice(value) {
  return Number.isFinite(Number(value))
    ? `$${Number(value).toFixed(3).replace(/\.?0+$/, '')}`
    : '待确认'
}

function formatOptionalPrice(value) {
  return value === null || value === undefined ? '不适用' : formatPrice(value)
}

function billingLabel(type) {
  return type === 'per_megapixel' ? '按 megapixel 计费' : '按图片计费'
}

function sourceUrl(item) {
  if (item.sourceUrl) {
    return item.sourceUrl
  }

  const officialSource = props.metadata.officialSources?.find(
    (source) => source.provider === item.provider || source.name === item.source,
  )

  return officialSource?.url || '#'
}
</script>
