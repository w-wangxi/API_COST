# AI API Cost Calculator

海外 AI 模型价格对比与用量估算器。用户可以输入预计使用量，快速比较 OpenAI、Anthropic 和 fal.ai 的 API 成本。

## 功能特点

- 文本模型成本估算：支持输入 tokens、输出 tokens、月请求次数和缓存输入价格。
- 图像模型成本估算：支持按图片计费和按 megapixel 计费。
- 成本排序：自动按预计月成本从低到高排序。
- 成本标识：高亮最低成本模型，并提示最高成本模型。
- 场景预设：内置学习助手、客服机器人、内容生成、代码助手和图片生成工具。
- 价格来源：展示官方价格页面名称和查询日期。

## 技术栈

- Vue 3
- Vite
- JavaScript
- CSS

## 价格数据来源

查询日期：2026-06-14

| 平台 | 官方页面 |
| --- | --- |
| OpenAI | OpenAI API Pricing |
| Anthropic | Anthropic Claude API Pricing |
| fal.ai | fal.ai Pricing |

> 价格数据写入本地配置文件 `src/data/pricingData.js`。由于 API 价格可能变化，实际费用请以官方账单和官方价格页面为准。

## 本地运行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

## 预览

```bash
npm run preview
```

## 部署

推荐部署到 Vercel、Netlify、Cloudflare Pages 或 GitHub Pages。

公网访问地址：待补充

## 项目地址

GitHub：<https://github.com/w-wangxi/API_COST>

## 项目截图

截图位置：待补充

## 后续优化方向

- 增加更多模型和 API 平台。
- 增加人民币汇率换算。
- 增加 Batch API 折扣计算。
- 增加长上下文价格计算。
- 增加图像、视频、音频多模态模型。
- 支持用户导出估算结果。
- 支持价格数据自动更新。
- 支持不同业务场景成本模板。
- 增加成本预算提醒。
- 增加模型性价比评分。
