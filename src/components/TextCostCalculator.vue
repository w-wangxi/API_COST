<template>
  <section id="text-calculator" class="section-block">
    <h2>文本模型成本估算</h2>
    <p>输入平均 tokens 和每月请求次数后，对比不同文本模型的预计月成本。</p>

    <div class="calculator-grid">
      <label class="field">
        <span>平均输入 tokens</span>
        <input type="number" min="1" value="1000" />
      </label>
      <label class="field">
        <span>平均输出 tokens</span>
        <input type="number" min="1" value="500" />
      </label>
      <label class="field">
        <span>每月请求次数</span>
        <input type="number" min="1" value="100000" />
      </label>
      <label class="toggle-field">
        <input type="checkbox" />
        <span>使用缓存输入价格</span>
      </label>
    </div>

    <div class="placeholder-panel">
      文本模型成本结果将在下一步接入实时计算。
    </div>
  </section>
</template>
