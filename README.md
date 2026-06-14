# AI API Cost Calculator

海外 AI 模型价格对比与用量估算器。前端负责成本计算与展示，后端负责每日调用 DeepSeek API 查询并整理最新价格数据。

## 功能特点

- 文本模型成本估算：输入 tokens、输出 tokens、月请求次数和缓存输入开关。
- 图像模型成本估算：支持按图片计费和按 megapixel 计费。
- 成本排序：自动按预计月成本从低到高排序。
- 场景预设：内置学习助手、客服机器人、内容生成、代码助手和图片生成工具。
- 独立价格页：价格来源与查询日期在 `#/pricing` 页面展示，来源名称可跳转官网。
- 每日价格缓存：后端优先使用 Redis，今天已更新则直接返回缓存；未配置 Redis 时退回本地文件缓存。

## 技术栈

- Frontend：Vue 3、Vite、JavaScript、CSS
- Backend：Node.js HTTP Server
- Pricing Agent：DeepSeek Chat Completions API

## 目录结构

```text
frontend/        # 前端 Vue 应用
backend/         # 独立后端 API 服务
scripts/dev.js   # 同时启动前端和后端的开发脚本
```

## 环境变量

复制 `.env.example` 为 `.env`，然后填入 DeepSeek API Key：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
VITE_API_BASE_URL=http://127.0.0.1:3001
BACKEND_HOST=127.0.0.1
BACKEND_PORT=3001
CORS_ORIGIN=*
REDIS_URL=redis://127.0.0.1:6379
REDIS_PRICING_CACHE_KEY=api-cost:pricing-cache
REDIS_CONNECT_TIMEOUT_MS=2000
```

`REDIS_URL` 可选。本地没有 Redis 时可以留空，后端会退回 `backend/cache/` 本地文件缓存；生产环境建议配置 Redis。

## 本地运行

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动：

- 后端 API：`http://127.0.0.1:3001`
- 前端 Vite 页面：以终端显示的 `Local` 地址为准

## 后端接口

```text
GET /api/health
GET /api/pricing
```

`GET /api/pricing` 的逻辑：

1. 优先读取 Redis 中的 `REDIS_PRICING_CACHE_KEY`。
2. 如果未配置 Redis 或 Redis 不可用，则读取 `backend/cache/pricing-cache.json` 作为本地兜底。
3. 如果缓存日期是今天，直接返回缓存。
4. 如果今天还没有缓存，后端抓取官方价格页和搜索发现页文本。
5. 后端调用 DeepSeek API，从页面文本中抽取结构化价格数据。
6. 写入当天缓存。配置 Redis 时写入 Redis；否则写入本地文件。
7. 如果刷新失败但存在同版本旧缓存，则返回旧缓存并标记为 `stale`。

本地缓存目录 `backend/cache/` 不提交；生产环境建议配置 Redis。

## 价格数据来源

| 平台 | 官方页面 |
| --- | --- |
| OpenAI | OpenAI API Pricing |
| Anthropic | Anthropic Claude API Pricing |
| fal.ai | fal.ai Pricing |
| Google | Gemini API Pricing |
| Mistral AI | Mistral AI Pricing |
| DeepSeek | DeepSeek API Pricing |
| xAI | xAI API Models and Pricing |
| Groq | Groq Models |
| Together AI | Together AI Pricing |

前端页面会优先请求后端接口 `GET /api/pricing` 获取价格数据。`frontend/src/data/pricingData.js` 不再保存模型价格，只保留场景预设。

## 打包前端

```bash
npm run build
```

## 分别启动

只启动前端：

```bash
npm run dev:frontend
```

只启动后端：

```bash
npm run dev:backend
```

## 部署

当前是前后端分离架构：

- 前端可以部署到 Vercel、Netlify 或 Cloudflare Pages。
- 后端需要部署到支持 Node.js 服务的平台，例如 Render、Railway、Fly.io 或自有服务器。
- 缓存建议使用 Redis，例如 Upstash Redis、Redis Cloud、Railway Redis 或自建 Redis。
- 部署前端时，将 `VITE_API_BASE_URL` 设置为后端公网地址。
- 部署后端时，配置 `DEEPSEEK_API_KEY`、`CORS_ORIGIN`、`REDIS_URL` 等环境变量。

公网访问地址：待补充
