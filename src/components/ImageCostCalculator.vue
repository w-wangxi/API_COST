<template>
  <section id="image-calculator" class="section-block">
    <h2>图像模型成本估算</h2>
    <p>输入图片数量和图片尺寸后，对比 fal.ai 图像模型的预计成本。</p>

    <div class="calculator-grid">
      <label class="field">
        <span>每月图片数量</span>
        <input type="number" min="1" value="10000" />
      </label>
      <label class="field">
        <span>每张图 megapixel</span>
        <input type="number" min="0.1" step="0.1" value="1" />
      </label>
    </div>

    <div class="placeholder-panel">
      图像模型成本结果将在后续步骤接入实时计算。
    </div>
  </section>
</template>
