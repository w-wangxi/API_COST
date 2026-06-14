import { readPricingCache, writePricingCache } from './cacheStore.js'
import { refreshPricingData } from './pricingSources.js'

const cacheVersion = 'deepseek-live-pricing-v8-search-discovery'

export async function getPricingData(options = {}) {
  const today = getLocalDateString()
  const { cache, store } = await readPricingCache()
  const forceRefresh = Boolean(options.forceRefresh)

  if (
    !forceRefresh &&
    cache?.cacheDate === today &&
    cache?.version === cacheVersion &&
    isValidCache(cache)
  ) {
    return withMetadata(cache.data, {
      source: 'backend-cache',
      cacheStore: store,
      fromCache: true,
      cacheDate: cache.cacheDate,
      lastUpdatedAt: cache.lastUpdatedAt,
    })
  }

  try {
    const freshData = await refreshPricingData()
    const nextCache = {
      version: cacheVersion,
      cacheDate: today,
      lastUpdatedAt: new Date().toISOString(),
      data: freshData,
    }

    const nextStore = await writePricingCache(nextCache)

    return withMetadata(freshData, {
      source: 'backend-deepseek-refresh',
      cacheStore: nextStore,
      fromCache: false,
      cacheDate: nextCache.cacheDate,
      lastUpdatedAt: nextCache.lastUpdatedAt,
    })
  } catch (error) {
    if (cache?.version === cacheVersion && isValidCache(cache)) {
      return withMetadata(cache.data, {
        source: 'backend-stale-cache',
        cacheStore: store,
        fromCache: true,
        stale: true,
        cacheDate: cache.cacheDate,
        lastUpdatedAt: cache.lastUpdatedAt,
        refreshError: error instanceof Error ? error.message : 'Unknown refresh error',
      })
    }

    throw error
  }
}

function isValidCache(cache) {
  return Boolean(
    cache?.data?.textModels?.length &&
      cache?.data?.imageModels?.length &&
      cache?.data?.textPresets?.length &&
      cache?.data?.imagePresets?.length,
  )
}

function withMetadata(data, metadata) {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      ...metadata,
    },
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
