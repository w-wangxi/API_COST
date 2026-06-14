import { imagePresets, textPresets } from '../frontend/src/data/pricingData.js'
import { extractPricingWithDeepSeek } from './deepseekPricingClient.js'

const MAX_SOURCE_CHARS = Number(process.env.SOURCE_SNAPSHOT_MAX_CHARS || 12000)

export const officialSources = [
  {
    provider: 'OpenAI',
    name: 'OpenAI API Pricing',
    url: 'https://openai.com/api/pricing/',
    fallbackUrls: ['https://developers.openai.com/api/docs/pricing', 'https://platform.openai.com/docs/pricing'],
  },
  {
    provider: 'Anthropic',
    name: 'Anthropic Claude API Pricing',
    url: 'https://platform.claude.com/docs/en/about-claude/pricing',
    fallbackUrls: ['https://docs.anthropic.com/en/docs/about-claude/pricing'],
  },
  {
    provider: 'fal.ai',
    name: 'fal.ai Pricing',
    url: 'https://fal.ai/pricing',
  },
  {
    provider: 'Google',
    name: 'Gemini API Pricing',
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    fallbackUrls: ['https://cloud.google.com/vertex-ai/generative-ai/pricing'],
  },
  {
    provider: 'Mistral AI',
    name: 'Mistral AI Pricing',
    url: 'https://mistral.ai/products/la-plateforme#pricing',
  },
  {
    provider: 'Alibaba Cloud',
    name: 'Alibaba Cloud Model Studio Pricing',
    url: 'https://www.alibabacloud.com/help/en/model-studio/billing-for-model-studio',
  },
  {
    provider: 'DeepSeek',
    name: 'DeepSeek API Pricing',
    url: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
  {
    provider: 'xAI',
    name: 'xAI API Models and Pricing',
    url: 'https://docs.x.ai/developers/models',
    fallbackUrls: ['https://docs.x.ai/docs/models/'],
  },
  {
    provider: 'Groq',
    name: 'Groq Models',
    url: 'https://console.groq.com/docs/models',
  },
  {
    provider: 'Together AI',
    name: 'Together AI Pricing',
    url: 'https://www.together.ai/pricing',
  },
  {
    provider: 'Moonshot AI',
    name: 'Moonshot AI Pricing',
    url: 'https://platform.moonshot.ai/docs/pricing',
  },
  {
    provider: 'Cohere',
    name: 'Cohere Pricing',
    url: 'https://cohere.com/pricing',
  },
]

const discoveryQueries = [
  {
    provider: 'OpenAI',
    name: 'OpenAI Latest GPT API Pricing Search',
    query: 'OpenAI GPT-5.5 API pricing input output tokens',
  },
  {
    provider: 'OpenAI',
    name: 'OpenAI Latest Image API Pricing Search',
    query: 'OpenAI GPT Image latest API pricing gpt-image',
  },
  {
    provider: 'Anthropic',
    name: 'Anthropic Latest Claude API Pricing Search',
    query: 'Anthropic Claude Opus 4.8 API pricing Claude latest model',
  },
  {
    provider: 'Anthropic',
    name: 'Anthropic Claude Fable API Pricing Search',
    query: 'Anthropic Claude Fable 5 API pricing',
  },
  {
    provider: 'Google',
    name: 'Google Latest Gemini API Pricing Search',
    query: 'Google Gemini 3 API pricing Gemini latest Pro Flash',
  },
  {
    provider: 'xAI',
    name: 'xAI Latest Grok API Pricing Search',
    query: 'xAI Grok 4 API pricing latest Grok model',
  },
].map((source) => ({
  ...source,
  sourceType: 'discovery-search',
  url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(source.query)}`,
}))

export async function refreshPricingData() {
  const sourceSnapshots = await Promise.all(
    [...officialSources, ...discoveryQueries].map(fetchOfficialSourceSnapshot),
  )

  return extractPricingWithDeepSeek(sourceSnapshots, {
    textPresets,
    imagePresets,
  })
}

async function fetchOfficialSourceSnapshot(source) {
  const urls = [source.url, ...(source.fallbackUrls || [])]
  const attempts = []

  for (const url of urls) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
          'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
        },
      })
      const html = await response.text()
      const text = htmlToText(html).slice(0, MAX_SOURCE_CHARS)
      attempts.push({ url, ok: response.ok, status: response.status, textLength: text.length })

      if (response.ok && text.length > 200) {
        return {
          ...source,
          url,
          fallbackUrls: undefined,
          attempts,
          ok: true,
          status: response.status,
          fetchedAt: new Date().toISOString(),
          text,
        }
      }
    } catch (error) {
      attempts.push({
        url,
        ok: false,
        status: null,
        error: error instanceof Error ? error.message : 'Unknown source fetch error',
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  const lastAttempt = attempts.at(-1)

  return {
    ...source,
    fallbackUrls: undefined,
    attempts,
    ok: false,
    status: lastAttempt?.status ?? null,
    fetchedAt: new Date().toISOString(),
    error: lastAttempt?.error || 'No source URL returned usable pricing text',
    text: '',
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#36;/g, '$')
    .replace(/\s+/g, ' ')
    .trim()
}
