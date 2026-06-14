import { imageModels, imagePresets, textModels, textPresets } from '../data/pricingData'

export function createFallbackPricingData() {
  return {
    textModels,
    imageModels,
    textPresets,
    imagePresets,
    metadata: {
      source: 'frontend-fallback',
      cacheDate: null,
      lastUpdatedAt: null,
      fromCache: false,
    },
  }
}

export async function fetchPricingData(options = {}) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const refreshQuery = options.forceRefresh ? '?refresh=1' : ''
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/pricing${refreshQuery}`)

  if (!response.ok) {
    let detail = ''

    try {
      const errorPayload = await response.json()
      detail = errorPayload.detail || errorPayload.error || ''
    } catch {
      detail = await response.text()
    }

    throw new Error(detail || `Pricing API responded with ${response.status}`)
  }

  const payload = await response.json()

  return {
    ...createFallbackPricingData(),
    ...payload,
    metadata: {
      ...createFallbackPricingData().metadata,
      ...payload.metadata,
    },
  }
}
