import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { refreshPricingData } from './pricingSources.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cacheDir = path.join(__dirname, 'cache')
const cacheFile = path.join(cacheDir, 'pricing-cache.json')
const cacheVersion = 'deepseek-live-pricing-v8-search-discovery'

export async function getPricingData(options = {}) {
  const today = getLocalDateString()
  const cache = await readCache()
  const forceRefresh = Boolean(options.forceRefresh)

  if (
    !forceRefresh &&
    cache?.cacheDate === today &&
    cache?.version === cacheVersion &&
    isValidCache(cache)
  ) {
    return withMetadata(cache.data, {
      source: 'backend-cache',
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

    await writeCache(nextCache)

    return withMetadata(freshData, {
      source: 'backend-deepseek-refresh',
      fromCache: false,
      cacheDate: nextCache.cacheDate,
      lastUpdatedAt: nextCache.lastUpdatedAt,
    })
  } catch (error) {
    if (cache?.version === cacheVersion && isValidCache(cache)) {
      return withMetadata(cache.data, {
        source: 'backend-stale-cache',
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

async function readCache() {
  try {
    return JSON.parse(await readFile(cacheFile, 'utf8'))
  } catch {
    return null
  }
}

async function writeCache(cache) {
  await mkdir(cacheDir, { recursive: true })
  await writeFile(cacheFile, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
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
