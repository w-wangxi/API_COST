import './loadEnv.js'
import { createServer } from 'node:http'
import { getPricingData } from './pricingCache.js'

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3001)
const host = process.env.BACKEND_HOST || '127.0.0.1'
const corsOrigin = process.env.CORS_ORIGIN || '*'

const server = createServer(async (request, response) => {
  setCorsHeaders(response)

  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    sendEmpty(response, 204)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'api-cost-backend' })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/pricing') {
    try {
      const data = await getPricingData({
        forceRefresh: url.searchParams.get('refresh') === '1',
      })
      sendJson(response, 200, data)
    } catch (error) {
      sendJson(response, 500, {
        error: 'Failed to load pricing data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/pricing/refresh') {
    try {
      const data = await getPricingData({ forceRefresh: true })
      sendJson(response, 200, data)
    } catch (error) {
      sendJson(response, 500, {
        error: 'Failed to refresh pricing data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found' })
})

server.listen(port, host, () => {
  console.log(`Backend API listening at http://${host}:${port}`)
})

function setCorsHeaders(response) {
  response.setHeader('access-control-allow-origin', corsOrigin)
  response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
  response.setHeader('access-control-allow-headers', 'content-type,authorization')
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode)
  response.end()
}
