<template>
  <div class="table-shell">
    <table>
      <thead>
        <tr>
          <th>排名</th>
          <th>厂商</th>
          <th>模型</th>
          <th>输入成本</th>
          <th>输出成本</th>
          <th>预计月成本</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(result, index) in results"
          :key="`${result.provider}-${result.model}`"
          :class="{
            'result-lowest': index === 0,
            'result-highest': index === results.length - 1,
          }"
        >
          <td>
            <span class="rank-badge">{{ index + 1 }}</span>
          </td>
          <td>{{ result.provider }}</td>
          <td>
            <span class="model-name">{{ result.model }}</span>
            <span v-if="index === 0" class="status-badge">最低成本</span>
            <span v-if="index === results.length - 1" class="status-badge muted">
              最高成本
            </span>
          </td>
          <td>{{ formatUSD(result.inputCost) }}</td>
          <td>{{ formatUSD(result.outputCost) }}</td>
          <td class="total-cost">{{ formatUSD(result.totalCost) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { formatUSD } from '../utils/costCalculator'

defineProps({
  results: {
    type: Array,
    default: () => [],
  },
})
</script>
