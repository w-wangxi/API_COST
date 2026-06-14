import './loadEnv.js'

const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const targetTextModels = [
  {
    provider: 'OpenAI',
    modelFamilies: [
      'GPT',
      'GPT flagship',
      'GPT mini',
      'GPT nano',
      'reasoning',
      'o-series',
      'o3',
      'o3-mini',
      'o4-mini',
      'o1',
    ],
    sourceName: 'OpenAI API Pricing',
  },
  {
    provider: 'Anthropic',
    modelFamilies: [
      'Claude',
      'Claude Opus',
      'Claude Sonnet',
      'Claude Haiku',
      'Opus',
      'Sonnet',
      'Haiku',
    ],
    sourceName: 'Anthropic Claude API Pricing',
  },
  {
    provider: 'Google',
    modelFamilies: [
      'Gemini',
      'Gemini Pro',
      'Gemini Flash',
      'Gemini Flash-Lite',
      'Gemini Flash Lite',
    ],
    sourceName: 'Gemini API Pricing',
  },
  {
    provider: 'xAI',
    modelFamilies: ['Grok', 'Grok Fast', 'Grok mini'],
    sourceName: 'xAI API Models and Pricing',
  },
  {
    provider: 'DeepSeek',
    modelFamilies: ['DeepSeek', 'DeepSeek V', 'DeepSeek R', 'deepseek-chat', 'deepseek-reasoner'],
    sourceName: 'DeepSeek API Pricing',
  },
  {
    provider: 'Alibaba Cloud',
    modelFamilies: ['Qwen', 'Qwen Max', 'Qwen Coder', 'QwQ'],
    sourceName: 'Alibaba Cloud Model Studio Pricing',
  },
  {
    provider: 'Meta',
    modelFamilies: ['Llama'],
    sourceName: 'Together AI Pricing or Groq Models',
  },
  {
    provider: 'Mistral AI',
    modelFamilies: ['Mistral', 'Mistral Large', 'Codestral', 'Ministral', 'Mixtral'],
    sourceName: 'Mistral AI Pricing',
  },
  {
    provider: 'Moonshot AI',
    modelFamilies: ['Kimi', 'Moonshot'],
    sourceName: 'Moonshot AI Pricing',
  },
  {
    provider: 'Cohere',
    modelFamilies: ['Command A', 'Command R+', 'Command R'],
    sourceName: 'Cohere Pricing',
  },
]
const targetImageModels = [
  {
    provider: 'OpenAI',
    modelFamilies: ['GPT Image', 'gpt-image', 'DALL-E'],
    sourceName: 'OpenAI API Pricing',
  },
  {
    provider: 'Google',
    modelFamilies: ['Imagen', 'Gemini image generation'],
    sourceName: 'Gemini API Pricing',
  },
  {
    provider: 'Black Forest Labs',
    modelFamilies: ['FLUX', 'FLUX Kontext', 'FLUX Pro', 'FLUX Schnell'],
    sourceName: 'fal.ai Pricing',
  },
  {
    provider: 'ByteDance',
    modelFamilies: ['Seedream'],
    sourceName: 'fal.ai Pricing',
  },
  {
    provider: 'Alibaba Cloud',
    modelFamilies: ['Qwen Image', 'Wan Image'],
    sourceName: 'Alibaba Cloud Model Studio Pricing',
  },
  {
    provider: 'Stability AI',
    modelFamilies: ['Stable Diffusion 3.5', 'Stable Image Ultra', 'Stable Image Core'],
    sourceName: 'fal.ai Pricing',
  },
  {
    provider: 'Ideogram',
    modelFamilies: ['Ideogram V3', 'Ideogram V2'],
    sourceName: 'fal.ai Pricing',
  },
]
const popularTextKeywords = targetTextModels.flatMap(({ modelFamilies }) => modelFamilies).map(normalizeKey)
const popularImageKeywords = targetImageModels.flatMap(({ modelFamilies }) => modelFamilies).map(normalizeKey)
const providerPriority = [
  'OpenAI',
  'Anthropic',
  'Google',
  'xAI',
  'DeepSeek',
  'Alibaba Cloud',
  'Mistral AI',
  'Moonshot AI',
  'Cohere',
  'Meta',
  'Qwen',
  'Black Forest Labs',
  'fal.ai',
  'Groq',
  'Together AI',
]

export async function extractPricingWithDeepSeek(sourceSnapshots, presetData) {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is required when daily pricing cache is missing')
  }

  const response = await fetch(`${deepseekBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: deepseekModel,
      temperature: 0.1,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content:
            'You extract AI API pricing for a fixed list of popular model families. Return only valid JSON. Prefer the supplied official page text. If a target provider page is unavailable or blocked, use your best current public knowledge for that provider and state that limitation in metadata.notes.',
        },
        {
          role: 'user',
          content: buildPrompt(sourceSnapshots, presetData),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`DeepSeek API failed with ${response.status}: ${detail}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('DeepSeek API returned an empty message')
  }

  return normalizePricingPayload(parseJsonContent(content), sourceSnapshots)
}

function buildPrompt(sourceSnapshots, presetData) {
  return JSON.stringify(
    {
      task:
        'Extract prices for the latest popular AI API model families from the supplied snapshots. The target lists below are broad company/product lines, not exact model names. Prefer the newest model names that appear in official pages or discovery-search snapshots, including newly released versions, and do not return every long-tail model.',
      selectionRules: [
        'For each requested company, search the snapshots for the listed product lines and return the newest current model names shown on the page.',
        'Do not assume the listed modelFamilies are exact versions. They are search categories. If any snapshot contains newer versions such as GPT-5.5, GPT-Image-2, Claude Opus 4.8, Gemini 3.x, or Grok 4.x, return those newer names instead of older GPT-4.1, Claude 4.5, Gemini 2.5, or Grok 3 entries.',
        'Prefer current non-deprecated models over legacy models, even when the legacy model name is better known.',
        'Return up to 6 text models per provider and up to 6 image models per provider.',
        'For OpenAI, prioritize GPT and o-series models. For Anthropic, prioritize Claude Opus/Sonnet/Haiku. For Google, prioritize Gemini. For xAI, prioritize Grok.',
        'For aggregator platforms such as Together AI, Groq, or fal.ai, set provider to the model owner when obvious, and keep source/sourceUrl pointing to the aggregator pricing page.',
        'Official pricing pages are preferred for prices. Discovery-search snapshots are allowed to discover newer model names and price snippets when official pages are blocked. When using discovery-search, keep source/sourceUrl as the provider official pricing URL when possible and mention the limitation in metadata.notes.',
        'Do not omit OpenAI, Anthropic, Google, or xAI unless no price can be inferred at all. If a provider is inferred because its page was blocked, keep source/sourceUrl as the official provider URL and mention inferred pricing in metadata.notes.',
      ],
      targetPopularModels: {
        text: targetTextModels,
        image: targetImageModels,
      },
      today: new Date().toISOString().slice(0, 10),
      requiredSchema: {
        textModels: [
          {
            provider: 'string',
            model: 'string',
            inputPrice: 'number, USD per 1M tokens',
            cachedInputPrice: 'number or null, USD per 1M tokens',
            outputPrice: 'number, USD per 1M tokens',
            unit: 'USD / 1M tokens',
            source: 'string',
            sourceUrl: 'official source URL',
            queryDate: 'YYYY-MM-DD',
          },
        ],
        imageModels: [
          {
            provider: 'fal.ai',
            model: 'string',
            price: 'number',
            billingType: 'per_image or per_megapixel',
            unit: 'USD / image or USD / megapixel',
            source: 'fal.ai Pricing',
            sourceUrl: 'official source URL',
            queryDate: 'YYYY-MM-DD',
          },
        ],
        textPresets: 'copy presetData.textPresets exactly',
        imagePresets: 'copy presetData.imagePresets exactly',
        metadata: {
          extractedBy: 'DeepSeek',
          notes: 'short string',
        },
      },
      presetData,
      snapshots: sourceSnapshots,
    },
    null,
    2,
  )
}

function normalizePricingPayload(payload, sourceSnapshots) {
  if (!Array.isArray(payload.textModels) || !Array.isArray(payload.imageModels)) {
    throw new Error('DeepSeek pricing payload is missing model arrays')
  }

  const textModels = selectPopularModels(payload.textModels.map(normalizeTextModel), {
    kind: 'text',
    maxPerProvider: 6,
  })
  const imageModels = selectPopularModels(payload.imageModels.map(normalizeImageModel), {
    kind: 'image',
    maxPerProvider: 6,
  })
  const missingCoreProviders = getMissingCoreProviders(textModels)
  const staleLatestProviders = getStaleLatestProviders(textModels, imageModels, sourceSnapshots)

  if (!textModels.length && !imageModels.length) {
    throw new Error('DeepSeek pricing payload did not include any usable model prices')
  }

  return {
    textModels,
    imageModels,
    textPresets: Array.isArray(payload.textPresets) ? payload.textPresets : [],
    imagePresets: Array.isArray(payload.imagePresets) ? payload.imagePresets : [],
    metadata: {
      ...payload.metadata,
      source: 'deepseek-refresh',
      deepseekModel,
      missingCoreProviders,
      staleLatestProviders,
      warnings: buildPricingWarnings(missingCoreProviders, staleLatestProviders),
      officialSources: sourceSnapshots.map(({ provider, name, url, sourceType, ok, status, fetchedAt }) => ({
        provider,
        name,
        url,
        sourceType,
        ok,
        status,
        fetchedAt,
      })),
    },
  }
}

function buildPricingWarnings(missingCoreProviders, staleLatestProviders) {
  const warnings = []

  if (missingCoreProviders.length) {
    warnings.push(`Missing popular providers: ${missingCoreProviders.join(', ')}`)
  }

  if (staleLatestProviders.length) {
    warnings.push(`Latest discovered models were not extracted for: ${staleLatestProviders.join(', ')}`)
  }

  return warnings
}

function getStaleLatestProviders(textModels, imageModels, sourceSnapshots) {
  const snapshotText = normalizeKey(
    sourceSnapshots.map((source) => `${source.provider} ${source.name} ${source.text || ''}`).join(' '),
  )
  const textModelText = normalizeKey(textModels.map((model) => `${model.provider} ${model.model}`).join(' '))
  const imageModelText = normalizeKey(imageModels.map((model) => `${model.provider} ${model.model}`).join(' '))
  const staleProviders = []

  if (/\bgpt\s*5(?:\s|\.\d|$)/.test(snapshotText) && !/\bgpt\s*5(?:\s|\.\d|$)/.test(textModelText)) {
    staleProviders.push('OpenAI GPT')
  }

  if (/\bgpt\s*image\s*(?:2|1\.5)\b/.test(snapshotText) && !/\bgpt\s*image\s*(?:2|1\.5)\b/.test(imageModelText)) {
    staleProviders.push('OpenAI image')
  }

  if (
    /\bclaude\b.*\b(?:4\.[6-9]|5(?:\s|\.|$))/.test(snapshotText) &&
    !/\bclaude\b.*\b(?:4\.[6-9]|5(?:\s|\.|$))/.test(textModelText)
  ) {
    staleProviders.push('Anthropic Claude')
  }

  if (/\bgemini\b.*\b3(?:\s|\.|$)/.test(snapshotText) && !/\bgemini\b.*\b3(?:\s|\.|$)/.test(textModelText)) {
    staleProviders.push('Google Gemini')
  }

  if (/\bgrok\b.*\b4(?:\s|\.|$)/.test(snapshotText) && !/\bgrok\b.*\b4(?:\s|\.|$)/.test(textModelText)) {
    staleProviders.push('xAI Grok')
  }

  return staleProviders
}

function getMissingCoreProviders(textModels) {
  const coreProviders = ['OpenAI', 'Anthropic', 'Google', 'xAI']
  const providerText = textModels.map((model) => `${model.provider} ${model.model}`.toLowerCase()).join(' ')

  return coreProviders.filter((provider) => {
    const providerKey = provider.toLowerCase()

    if (provider === 'OpenAI') {
      return !/(openai|gpt|^|\s)o[134]\b/.test(providerText)
    }

    if (provider === 'Anthropic') {
      return !/(anthropic|claude)/.test(providerText)
    }

    if (provider === 'Google') {
      return !/(google|gemini)/.test(providerText)
    }

    if (provider === 'xAI') {
      return !/(xai|x\.ai|grok)/.test(providerText)
    }

    return !providerText.includes(providerKey)
  })
}

function selectPopularModels(models, { kind, maxPerProvider }) {
  const keywords = kind === 'image' ? popularImageKeywords : popularTextKeywords
  const targets = kind === 'image' ? targetImageModels : targetTextModels
  const rankedModels = models
    .filter(hasFinitePrice)
    .filter((model) => matchesTargetModel(model, kind, keywords))
    .sort((a, b) => modelRank(a, targets, keywords) - modelRank(b, targets, keywords))
  const counts = new Map()

  return rankedModels.filter((model) => {
    const provider = model.provider || 'Unknown'
    const count = counts.get(provider) || 0

    if (count >= maxPerProvider) {
      return false
    }

    counts.set(provider, count + 1)
    return true
  })
}

function matchesTargetModel(model, kind, keywords) {
  const haystack = normalizeKey(`${model.provider} ${model.model}`)

  if (keywords.some((keyword) => haystack.includes(keyword))) {
    return true
  }

  if (kind === 'text') {
    return /\bo\d+(?:\s|$)/.test(haystack)
  }

  return /\bgpt\s+image\s+\d+/.test(haystack)
}

function hasFinitePrice(model) {
  if ('price' in model) {
    return Number.isFinite(model.price)
  }

  return Number.isFinite(model.inputPrice) && Number.isFinite(model.outputPrice)
}

function modelRank(model, targets, keywords) {
  const providerIndex = providerPriority.findIndex((provider) =>
    String(model.provider).toLowerCase().includes(provider.toLowerCase()),
  )
  const providerScore = providerIndex === -1 ? providerPriority.length : providerIndex
  const haystack = normalizeKey(`${model.provider} ${model.model}`)
  const targetProviderIndex = targets.findIndex(({ provider }) => haystack.includes(normalizeKey(provider)))
  const targetProviderScore = targetProviderIndex === -1 ? targets.length : targetProviderIndex
  const keywordIndex = keywords.findIndex((keyword) => haystack.includes(keyword))
  const keywordScore = keywordIndex === -1 ? keywords.length : keywordIndex
  const economyPenalty = /lite|tiny|small|old|preview|throughput/i.test(model.model) ? 2 : 0
  const versionBonus = getModelVersionScore(model.model)

  return providerScore * 1000 + targetProviderScore * 100 + keywordScore * 10 + economyPenalty - versionBonus
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getModelVersionScore(modelName) {
  const versions = String(modelName || '').match(/\d+(?:\.\d+)?/g) || []

  return versions.reduce((score, version, index) => {
    const value = Number(version)

    if (!Number.isFinite(value)) {
      return score
    }

    return score + value * (index === 0 ? 10 : 1)
  }, 0)
}

function normalizeTextModel(model) {
  return {
    provider: String(model.provider || ''),
    model: String(model.model || ''),
    inputPrice: Number(model.inputPrice),
    cachedInputPrice: model.cachedInputPrice === null ? null : Number(model.cachedInputPrice),
    outputPrice: Number(model.outputPrice),
    unit: model.unit || 'USD / 1M tokens',
    source: model.source || `${model.provider} Pricing`,
    sourceUrl: model.sourceUrl || getSourceUrl(model.provider),
    queryDate: model.queryDate || new Date().toISOString().slice(0, 10),
  }
}

function normalizeImageModel(model) {
  return {
    provider: String(model.provider || ''),
    model: String(model.model || ''),
    price: Number(model.price),
    billingType: model.billingType === 'per_megapixel' ? 'per_megapixel' : 'per_image',
    unit: model.unit || (model.billingType === 'per_megapixel' ? 'USD / megapixel' : 'USD / image'),
    source: model.source || `${model.provider} Pricing`,
    sourceUrl: model.sourceUrl || getSourceUrl(model.provider),
    queryDate: model.queryDate || new Date().toISOString().slice(0, 10),
  }
}

function parseJsonContent(content) {
  const trimmed = content.trim()
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)

  return JSON.parse(fencedMatch ? fencedMatch[1] : trimmed)
}

function getSourceUrl(provider) {
  const normalizedProvider = String(provider || '').toLowerCase()

  if (normalizedProvider.includes('openai')) {
    return 'https://openai.com/api/pricing/'
  }

  if (normalizedProvider.includes('anthropic')) {
    return 'https://platform.claude.com/docs/en/about-claude/pricing'
  }

  if (normalizedProvider.includes('fal')) {
    return 'https://fal.ai/pricing'
  }

  if (normalizedProvider.includes('google') || normalizedProvider.includes('gemini')) {
    return 'https://ai.google.dev/gemini-api/docs/pricing'
  }

  if (normalizedProvider.includes('mistral')) {
    return 'https://mistral.ai/products/la-plateforme#pricing'
  }

  if (
    normalizedProvider.includes('alibaba') ||
    normalizedProvider.includes('qwen') ||
    normalizedProvider.includes('dashscope')
  ) {
    return 'https://www.alibabacloud.com/help/en/model-studio/billing-for-model-studio'
  }

  if (normalizedProvider.includes('moonshot') || normalizedProvider.includes('kimi')) {
    return 'https://platform.moonshot.ai/docs/pricing'
  }

  if (normalizedProvider.includes('cohere')) {
    return 'https://cohere.com/pricing'
  }

  if (normalizedProvider.includes('xai') || normalizedProvider.includes('x.ai')) {
    return 'https://docs.x.ai/developers/models'
  }

  if (normalizedProvider.includes('together')) {
    return 'https://www.together.ai/pricing'
  }

  if (normalizedProvider.includes('groq')) {
    return 'https://console.groq.com/docs/models'
  }

  if (normalizedProvider.includes('meta') || normalizedProvider.includes('llama')) {
    return 'https://www.together.ai/pricing'
  }

  if (
    normalizedProvider.includes('black forest') ||
    normalizedProvider.includes('bytedance') ||
    normalizedProvider.includes('stability') ||
    normalizedProvider.includes('ideogram')
  ) {
    return 'https://fal.ai/pricing'
  }

  return ''
}
