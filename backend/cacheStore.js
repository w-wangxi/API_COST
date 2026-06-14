import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from 'redis'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cacheDir = path.join(__dirname, 'cache')
const cacheFile = path.join(cacheDir, 'pricing-cache.json')
const cacheKey = process.env.REDIS_PRICING_CACHE_KEY || 'api-cost:pricing-cache'
const redisConnectTimeoutMs = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 2000)
const redisUrl = process.env.REDIS_URL

let redisClientPromise = null
let redisDisabled = false

export async function readPricingCache() {
  const redisCache = await readRedisCache()

  if (redisCache) {
    return {
      cache: redisCache,
      store: 'redis',
    }
  }

  return {
    cache: await readFileCache(),
    store: 'file',
  }
}

export async function writePricingCache(cache) {
  if (await writeRedisCache(cache)) {
    return 'redis'
  }

  await writeFileCache(cache)
  return 'file'
}

async function readRedisCache() {
  const client = await getRedisClient()

  if (!client) {
    return null
  }

  try {
    const value = await client.get(cacheKey)
    return value ? JSON.parse(value) : null
  } catch {
    redisDisabled = true
    return null
  }
}

async function writeRedisCache(cache) {
  const client = await getRedisClient()

  if (!client) {
    return false
  }

  try {
    await client.set(cacheKey, JSON.stringify(cache))
    return true
  } catch {
    redisDisabled = true
    return false
  }
}

async function getRedisClient() {
  if (!redisUrl || redisDisabled) {
    return null
  }

  if (!redisClientPromise) {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: redisConnectTimeoutMs,
        reconnectStrategy: false,
      },
    })

    client.on('error', () => {
      redisDisabled = true
    })

    redisClientPromise = client.connect().then(() => client)
  }

  try {
    return await redisClientPromise
  } catch {
    redisDisabled = true
    redisClientPromise = null
    return null
  }
}

async function readFileCache() {
  try {
    return JSON.parse(await readFile(cacheFile, 'utf8'))
  } catch {
    return null
  }
}

async function writeFileCache(cache) {
  await mkdir(cacheDir, { recursive: true })
  await writeFile(cacheFile, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
}
